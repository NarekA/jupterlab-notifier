import _ from 'lodash';

import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { Session, Kernel } from "@jupyterlab/services";

// import { ITopBar } from "jupyterlab-topbar";

import { TabBarSvg } from '@jupyterlab/ui-components';
import { ReactWidget } from '@jupyterlab/apputils';

import { Widget } from '@phosphor/widgets';


import * as React from "react";

import ReactDOM from 'react-dom';

// import ReactDOM from 'react-dom';
// import {ReactElement} from "react";

// interface INotificationsSettingsManager {
//   minExecutionTime: number;
//   button: HTMLDivElement;
//   enabled: boolean;
//   checkBox: HTMLInputElement;
//   handleClick(): void;
//   handleToggle(): void;
// }

function spawnNotification(body: string, title: string, icon: string) {
  let options = {
    body: body,
    // icon: 'https://ml.lyft.net/static/img/python.png',
  };
  new Notification(title, options);
}


export namespace NotifiyComponent {
  export interface IProps {
    widget: NotifyWidget;
    minExecutionTime: number;
    enabled: boolean;
  }

  export interface IState {
    minExecutionTime: number;
    enabled: boolean;
  }
}

export class NotifiyComponent extends React.Component<
  NotifiyComponent.IProps,
  NotifiyComponent.IState
> {
  body: HTMLDivElement;
  widget: NotifyWidget;
  constructor(props: NotifiyComponent.IProps) {
    super(props);
    this.state = {
      minExecutionTime: props.minExecutionTime,
      enabled: props.enabled
    };
    this.widget = props.widget;
    this.widget.settings = this.state;
  }

  /**
   * Render the list view using the virtual DOM.
   */
  render(): React.ReactNode {
    return (
      <input
        className="jupyterlab-notifier-settings-input"
        type="number"
        onChange={ this.handleChange }
        value={this.state.minExecutionTime.toString()}
      />
    );
  }
  /**
   * Handler for search input changes.
   */
  handleChange = (e: React.FormEvent<HTMLElement>) => {
    let target = e.currentTarget as HTMLInputElement;
    console.log('data');
    console.log('e', e);
    console.log('currentTarget', target.value);
    this.setState({
      minExecutionTime: parseInt(target.value)
    });
    this.widget.settings = this.state;
  };

}

export class NotifyWidget extends ReactWidget {
  settings: NotifiyComponent.IState;
  /**
   * Creates a toolbar button
   * @param props props for underlying `ToolbarButton` componenent
   */
  constructor(private props: NotifiyComponent.IState) {
    super();
  }

  render() {
    return <NotifiyComponent widget={this} {...this.props} />;
  }
}

// export class NotifiyComponent extends ReactWidget {
//   minExecutionTime: number;
//   button: React.ReactElement;
//   enabled: boolean;
//   checkBox: React.ReactElement;
//
//   constructor(topBar: ITopBar) {
//     super();
//
//     this.minExecutionTime = parseInt(localStorage['jupyter-notifier/minExecutionTime'] || '60');
//     this.enabled = (localStorage['jupyter-notifier/enabled'] || 'false') == 'true';

    // const div: React.ReactElement = React.createElement('div', null, null);
    // div.setAttribute('display', 'inline');
    // div.classList.add('notify-topbar');


    // this.button = React.createElement('div', null, null);
    // this.button.classList.add('fa', 'fa-bell');
    // this.button.textContent = `notifying > ${this.minExecutionTime} seconds`;
    // this.button.onclick = () => { this.handleClick() };
    //
    // div.appendChild(this.checkBox);
    // div.appendChild(this.button);
    // topBar.addItem('notifications', new Widget({ node: div }));
  // };
  //
  // protected render(): React.ReactElement<any> {
  //   this.checkBox = React.createElement('' +
  //       'input',
  //       {
  //         checked: this.enabled,
  //         onclick: () => { this.handleToggle() },
  //         textContent:  "Notifications Enabled"
  //       },
  //   null
  //   );
  //   this.checkBox.type = 'checkbox';
  //   return React.createElement('div', null, [this.checkBox]);
  // }

  // handleClick(): void {
  //   InputDialog.getNumber({
  //     title: 'Notify for executions longer than (seconds)',
  //     value: this.minExecutionTime
  //   }).then(value => {
  //     this.minExecutionTime = value.value;
  //     localStorage['jupyter-notifier/minExecutionTime'] = value.value.toString();
  //     this.button.textContent = `notifying > ${this.minExecutionTime} seconds`;
  //   });
  // }

//   handleToggle(): void {
//     this.enabled = ! this.enabled;
//     this.checkBox.chan = this.enabled;
//     localStorage['jupyter-notifier/enabled'] = this.enabled.toString();
//   };
// }

/**
 * Initialization data for the jupyterlab-notifier extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-notifier',
  autoStart: true,
  requires: [ILayoutRestorer],
  activate: (
      app: JupyterFrontEnd,
      restorer: ILayoutRestorer | null
      // topBar: ITopBar
  ) => {

    const sessions = app.serviceManager.sessions;
    const kernelStatuses: { [email: string]: Kernel.IModel } = {};
    const { shell } = app;

    const notifyTab = new TabBarSvg<Widget>({
      kind: 'sideBar',
      orientation: 'vertical',
    });

    if (restorer) {
      restorer.add(notifyTab, 'tab-manager');
    }
    const header = document.createElement('header');

    notifyTab.id = 'notify-manager';
    notifyTab.title.iconClass = 'jp-TabIcon jp-SideBar-tabIcon';
    notifyTab.title.caption = 'Notifications';
    header.textContent = 'Open Tabs';
    notifyTab.node.insertBefore(header, notifyTab.contentNode);
    shell.add(notifyTab, 'left', { rank: 600 });
    const notifyWidget: NotifyWidget = new NotifyWidget({minExecutionTime:1, enabled:true});
    ReactDOM.render(notifyWidget.render(), notifyTab.node);

    const onRunningChanged = (
        sender: Session.IManager,
        models: Session.IModel[]
    ) => {

      models.forEach(( session: Session.IModel ) => {
        const newKernel: Kernel.IModel = session.kernel;
        const oldKernel: Kernel.IModel = _.get(kernelStatuses, [newKernel.id]);
        if (notifyWidget.settings.enabled && _.get(newKernel, ['execution_state']) === 'idle') {

          const newTimeString: string = _.get(newKernel, ['last_activity'], '0').toString();
          const newTime: number = Date.parse(newTimeString);
          const oldTime: number = Date.parse(_.get(oldKernel, ['last_activity'], newTimeString).toString());

          if (oldTime != newTime) {
            const elapsedTime: number = newTime - oldTime;
            if (elapsedTime > notifyWidget.settings.minExecutionTime * 1000) {
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
