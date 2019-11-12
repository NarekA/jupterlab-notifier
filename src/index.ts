import _ from 'lodash';

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { Session, Kernel } from "@jupyterlab/services";

import { ITopBar } from "jupyterlab-topbar";

import { InputDialog } from "@jupyterlab/apputils";

import { Widget } from '@phosphor/widgets';

interface INotificationsSettingsManager {
  minExecutionTime: number;
  button: HTMLDivElement;
  enabled: boolean;
  checkBox: HTMLInputElement;
  handleClick(): void;
  handleToggle(): void;
}

function spawnNotification(body: string, title: string, icon: string) {
  let options = {
    body: body,
    // icon: 'https://ml.lyft.net/static/img/python.png',
  };
  new Notification(title, options);
}

export class NotificationManager implements INotificationsSettingsManager {
  minExecutionTime: number;
  button: HTMLDivElement;
  enabled: boolean;
  checkBox: HTMLInputElement;

  constructor(topBar: ITopBar) {

    this.minExecutionTime = parseInt(localStorage['jupyter-notifier/minExecutionTime'] || '60');
    this.enabled = (localStorage['jupyter-notifier/enabled'] || 'false') == 'true';

    const div: HTMLDivElement = document.createElement('div');
    div.setAttribute('display', 'inline');
    div.classList.add('notify-topbar');

    this.checkBox = document.createElement('input');
    this.checkBox.type = 'checkbox';
    this.checkBox.checked = this.enabled;
    this.checkBox.onclick = () => { this.handleToggle() };
    this.checkBox.textContent = "Notifications Enabled";

    this.button = document.createElement('div');
    this.button.classList.add('fa', 'fa-bell');
    this.button.textContent = `notifying > ${this.minExecutionTime} seconds`;
    this.button.onclick = () => { this.handleClick() };

    div.appendChild(this.checkBox);
    div.appendChild(this.button);
    topBar.addItem('notifications', new Widget({ node: div }));
  };

  handleClick(): void {
    InputDialog.getNumber({
      title: 'Notify for executions longer than (seconds)',
      value: this.minExecutionTime
    }).then(value => {
      this.minExecutionTime = value.value;
      localStorage['jupyter-notifier/minExecutionTime'] = value.value.toString();
      this.button.textContent = `notifying > ${this.minExecutionTime} seconds`;
    });
  }

  handleToggle(): void {
    this.enabled = ! this.enabled;
    this.checkBox.checked = this.enabled;
    localStorage['jupyter-notifier/enabled'] = this.enabled.toString();
  };
}

/**
 * Initialization data for the jupyterlab-notifier extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-notifier',
  autoStart: true,
  requires: [ITopBar],
  activate: (
      app: JupyterFrontEnd,
      topBar: ITopBar
  ) => {

    const sessions = app.serviceManager.sessions;
    const kernelStatuses: { [email: string]: Kernel.IModel } = {};
    const notifySettings: NotificationManager = new NotificationManager(topBar);

    const onRunningChanged = (
        sender: Session.IManager,
        models: Session.IModel[]
    ) => {

      models.forEach(( session: Session.IModel ) => {
        const newKernel: Kernel.IModel = session.kernel;
        const oldKernel: Kernel.IModel = _.get(kernelStatuses, [newKernel.id]);
        if (notifySettings.enabled && _.get(newKernel, ['execution_state']) === 'idle') {

          const newTimeString: string = _.get(newKernel, ['last_activity'], '0').toString();
          const newTime: number = Date.parse(newTimeString);
          const oldTime: number = Date.parse(_.get(oldKernel, ['last_activity'], newTimeString).toString());

          if (oldTime != newTime) {
            const elapsedTime: number = newTime - oldTime;
            if (elapsedTime > notifySettings.minExecutionTime * 1000) {
              spawnNotification(`${session.name} Finished Execution`, 'Execution complete', 'jupyter.png');
            }
          }
        }
        kernelStatuses[newKernel.id] = newKernel;
      });

    };

    sessions.runningChanged.connect(onRunningChanged);
  }
};

export default extension;
