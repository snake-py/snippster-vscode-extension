import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { discoverAllSnippsterSnippetsFiles } from '../../extension';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Find all snippster.snippets files with the discoverAllSnippsterSnippetsFiles function', async () => {
        const result = await discoverAllSnippsterSnippetsFiles();
        assert.equal(result.length, 0);
    });

    test('Find all snippster.snippets files with the discoverAllSnippsterSnippetsFiles function', async () => {
        await createTestFile('snippster.snippets.json', 'test');
        const result = await discoverAllSnippsterSnippetsFiles();
        assert.equal(result.length, 1);
    });
});

const createTestFile = async (fileName: string, content: string) => {
    const uri = vscode.Uri.parse(`untitled:${fileName}`);
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document);
    await editor.edit((editBuilder) => {
        editBuilder.insert(new vscode.Position(0, 0), content);
    });
    return uri;
};
