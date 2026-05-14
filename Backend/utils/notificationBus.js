import { EventEmitter } from 'events';

const notificationBus = new EventEmitter();
notificationBus.setMaxListeners(50);

export default notificationBus;
