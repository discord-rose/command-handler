import { DiscordEventMap, Worker } from 'jadl'

export class WorkerInject<W extends Worker = Worker> {
  _setup(worker: W): void {}

  _onInteraction(int: DiscordEventMap['INTERACTION_CREATE'], worker: W): void {}
}
