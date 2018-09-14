export default interface Disposable {
  dispose(): Promise<void>;
}
