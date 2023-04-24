import * as vscode from 'vscode';
import * as fs from 'fs';

interface Snippet {
    body: string;
    description: string;
    prefix: string;
    language?: string;
}

type SnippetCollection = {
    path: string;
    snippets: {
        [key: string]: Snippet;
    };
};

export function activate(context: vscode.ExtensionContext) {
    let discover = vscode.commands.registerCommand('snippster.discoverSnippets', discoverSnippets);
    discoverSnippets();
    context.subscriptions.push(discover);
}

const discoverSnippets = () => {
    discoverAllSnippsterSnippetsFiles().then((paths) => {
        const snippets: SnippetCollection[] = [];
        paths.forEach((uri) => {
            const snippetsFromOneFile = parseJsonFile(uri.fsPath);
            if ('snippets' in snippetsFromOneFile) {
                snippets.push(snippetsFromOneFile);
            }
        });
        registerSnippets(snippets);
    });
};

const parseJsonFile = (path: string): SnippetCollection | {} => {
    try {
        const data = fs.readFileSync(path, 'utf8');
        return {
            snippets: JSON.parse(data),
            path,
        };
    } catch (error) {
        vscode.window.showErrorMessage(`Error parsing ${path}: ${error}`);
        console.error(`Error parsing ${path}: ${error}`);
        return {};
    }
};

export const discoverAllSnippsterSnippetsFiles = async () => {
    const result = vscode.workspace.findFiles('**/snippster.*.json');
    return result;
};

const registerSnippets = (snippets: SnippetCollection[]) => {
    if (snippets.length === 0) {
        return;
    }
    snippets.forEach((snippetCollection) => {
        const snippetLanguage = resolveLanguageFromUri(snippetCollection.path) || 'plaintext';
        Object.keys(snippetCollection.snippets).forEach((key) => {
            const snippetObject = new vscode.SnippetString(snippetCollection.snippets[key].body);
            registerCompletionItemProvider(snippetLanguage, snippetObject, key);
        });
    });
};

const registerCompletionItemProvider = (
    snippetLanguage: string | string[],
    snippetObject: any,
    name: string
) => {
    vscode.languages.registerCompletionItemProvider(
        snippetLanguage,
        // [{ scheme: 'file', language: 'javascript' }],
        {
            provideCompletionItems(document, position) {
                const start = new vscode.Position(position.line, 0);
                const range = new vscode.Range(start, position);
                const completionItems = Object.keys(snippetObject).map((key) => {
                    const snippet = new vscode.SnippetString(snippetObject[key]);
                    const completionItem = new vscode.CompletionItem(
                        key,
                        vscode.CompletionItemKind.Snippet
                    );
                    completionItem.range = range;
                    completionItem.insertText = snippet;
                    return completionItem;
                });
                return completionItems;
            },
        },
        name
    );
};

const dependencyFolderNameMap: {
    [key: string]: string[];
} = {
    node_modules: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    vendor: ['php'],
    bower_components: ['html'],
};

const resolveLanguageFromUri = (uri: string) => {
    const pathAsArray = uri.split('/');
    const fileName = pathAsArray[pathAsArray.length - 1];
    const language = fileName.split('.')[1];
    if (language !== 'snippets') {
        return language;
    }
    const dependencyFolderName = pathAsArray[pathAsArray.length - 2];

    if (dependencyFolderName in dependencyFolderNameMap) {
        return dependencyFolderNameMap[dependencyFolderName];
    }

    return undefined;
};

export function deactivate() {}
