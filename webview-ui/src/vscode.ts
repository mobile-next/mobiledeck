declare function acquireVsCodeApi(): any;

// acquire the vscode api once at module load time
// to avoid "An instance of the VS Code API has already been acquired" error
const vscode = typeof acquireVsCodeApi === 'function'
  ? acquireVsCodeApi()
  : {
      // mock for standalone development
      postMessage: (message: any) => {
        console.log('mobiledeck: mock postMessage', message);
      },
    };

export default vscode;
