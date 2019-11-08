import _ from 'lodash';

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { Session, Kernel } from "@jupyterlab/services";

import { ITopBar } from "jupyterlab-topbar";

import { Button } from "@blueprintjs/core";

import { ReactWidget, InputDialog } from "@jupyterlab/apputils";

import {Widget} from '@phosphor/widgets';

interface INotificationsSettingsManager {
  minExecutionTime: number;
  buttonWidget: ReactWidget;
  enabled: boolean;
  checkObject: HTMLInputElement;
  handleClick(): void;
  handleToggle(): void;
}

function spawnNotification(body: string, title: string, icon: string) {
  let options = {
    body: body,
    // icon: icon,
  };
  new Notification(title, options);
}

export class NotificationManager implements INotificationsSettingsManager {
  minExecutionTime: number;
  buttonWidget: ReactWidget;
  enabled: boolean;
  checkObject: HTMLInputElement;
  checkWidget: Widget;


  constructor(topBar: ITopBar) {

    this.minExecutionTime = parseInt(localStorage['jupyter-notifier/minExecutionTime'] || '5');
    this.enabled = (localStorage['jupyter-notifier/enabled'] || 'true') == 'true';
    const button: Button = new Button({
      text: `notifying > ${this.minExecutionTime} seconds`,
      type: 'button',
      icon: 'notifications',
      onClick: () => { this.handleClick() }
    });
    this.buttonWidget = ReactWidget.create(button.render());
    topBar.addItem("notification-button", this.buttonWidget);

    this.checkObject = document.createElement('input');
    this.checkObject.type = 'checkbox';
    this.checkObject.checked = this.enabled;
    this.checkObject.onclick = this.handleToggle;
    this.checkObject.textContent = "Notifications Enabled";

    this.checkWidget = new Widget({ node: this.checkObject });
    topBar.addItem('notification-toggle', this.checkWidget);
  };

  handleClick(): void {
    InputDialog.getNumber({
      title: 'Notify for executions longer than (seconds)',
      value: this.minExecutionTime
    }).then(value => {
      this.minExecutionTime = value.value;
      localStorage['jupyter-notifier/minExecutionTime'] = value.value.toString();
      this.buttonWidget.node.firstChild.textContent = `notifying > ${this.minExecutionTime} seconds`;
    });
  }

  handleToggle(): void {
    this.enabled = ! this.enabled;
    this.checkObject.checked = this.enabled;
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
    console.log('JupyterLab extension jupyterlab-notifier is activated!');

    const sessions = app.serviceManager.sessions;
    const kernelStatuses: { [email: string]: Kernel.IModel } = {};
    const manager: NotificationManager = new NotificationManager(topBar);

    Notification.requestPermission().then(function(result) {
      console.log(result);
    });

    const onRunningChanged = (
        sender: Session.IManager,
        models: Session.IModel[]
    ) => {
      console.log('sender', sender);
      console.log('models', models);

      models.forEach(( session: Session.IModel ) => {
        if (!manager.enabled) {
          return;
        }
        const newKernel: Kernel.IModel = session.kernel;
        const oldKernel: Kernel.IModel = _.get(kernelStatuses, [newKernel.id]);
        if (_.get(newKernel, ['execution_state']) === 'idle' &&
            _.get(oldKernel, ['execution_state']) === 'busy') {

          const newTimeString: string = _.get(newKernel, ['last_activity'], '0').toString();
          const newTime: number = Date.parse(newTimeString);
          const oldTime: number = Date.parse(_.get(oldKernel, ['last_activity'], newTimeString).toString());

          if (oldTime != newTime) {
            const elapsedTime: number = newTime - oldTime;
            if (elapsedTime > 10000) {
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
