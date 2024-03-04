"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
class TlvFormatter {
    bertlv_tag_calc_decode_size(data) {
        let i = 0;
        if (!data[0])
            return 0;
        if ((data[i++] & 0x1f) != 0x1f)
            return 1;
        for (; data[i] & 0x80; i++)
            ;
        return i + 1;
    }
    bertlv_tag_decode(data) {
        let size = this.bertlv_tag_calc_decode_size(data);
        if (!size)
            return 0;
        let tag = 0;
        for (let i = 0; i < size; i++) {
            tag <<= 8;
            tag |= data[i];
        }
        return tag;
    }
    bertlv_get_tag(tlv) {
        return this.bertlv_tag_decode(tlv) >>> 0;
    }
    bertlv_len_calc_decode_size(data) {
        if (!(data[0] & 0x80))
            return 1;
        let subsequence_count = data[0] & ~0x80;
        if (subsequence_count == 0 || subsequence_count == 0x7F)
            return 0;
        return 1 + subsequence_count;
    }
    bertlv_len_decode(data) {
        let size = this.bertlv_len_calc_decode_size(data);
        if (!size)
            return 0;
        if (size == 1)
            return data[0];
        let length = 0;
        for (let i = 1; i < size; ++i) {
            length <<= 8;
            length |= data[i];
        }
        return length;
    }
    bertlv_get_length(tlv) {
        let i = 0;
        if (!tlv)
            return 0;
        let tag_size = this.bertlv_tag_calc_decode_size(tlv);
        if (!tag_size)
            return 0;
        i += tag_size;
        return this.bertlv_len_decode(tlv.slice(i));
    }
    bertlv_get_value(tlv) {
        let i = 0;
        let tag_size = this.bertlv_tag_calc_decode_size(tlv);
        if (!tag_size)
            return null;
        i += tag_size;
        let len_size = this.bertlv_len_calc_decode_size(tlv.slice(i));
        if (!len_size)
            return null;
        let len = this.bertlv_len_decode(tlv.slice(i));
        i += len_size;
        return tlv.slice(i, i + len);
    }
    bertlv_is_contstructed_tag(tag) {
        if (tag & 0xff000000)
            return tag & 0x20000000;
        else if (tag & 0xff0000)
            return tag & 0x200000;
        else if (tag & 0xff00)
            return tag & 0x2000;
        else
            return tag & 0x20;
    }
    bertlv_get_total_size(tlv) {
        let tag_size = this.bertlv_tag_calc_decode_size(tlv);
        if (!tag_size)
            return 0;
        tlv = tlv.slice(tag_size);
        let len_size = this.bertlv_len_calc_decode_size(tlv);
        if (!len_size)
            return 0;
        let len_value = this.bertlv_len_decode(tlv);
        return tag_size + len_size + len_value;
    }
    getString(buf) {
        var s = "";
        for (let i = 0; i < buf.length; i++)
            s += buf[i].toString(16).padStart(2, '0');
        return s;
    }
    get_pretty_tlv(tlv, indent) {
        var s = "";
        while (tlv.length > 0) {
            let tag = this.bertlv_get_tag(tlv);
            let len = this.bertlv_get_length(tlv);
            if (this.bertlv_is_contstructed_tag(tag)) {
                s += '  '.repeat(indent) + `${tag.toString(16)} ${len.toString(16).padStart(2, '0')}` + '\n';
                let val = this.bertlv_get_value(tlv);
                s += this.get_pretty_tlv(val, indent + 1);
                let size = this.bertlv_get_total_size(tlv);
                tlv = tlv.slice(size);
            }
            else {
                var s_tag = `${tag.toString(16)} ${len.toString(16).padStart(2, '0')} `;
                s_tag += this.getString(this.bertlv_get_value(tlv));
                s += '  '.repeat(indent) + s_tag + '\n';
                let size = this.bertlv_get_total_size(tlv);
                tlv = tlv.slice(size);
            }
        }
        return s;
    }
    format(text) {
        let array = text.match(/..?/g);
        var new_array = [];
        if (array) {
            for (let i = 0; i < array.length; i++) {
                new_array[i] = parseInt('0x' + array[i], 16);
            }
            return this.get_pretty_tlv(new_array, 0);
        }
        return "error";
    }
}
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('tlv-formatter.format', () => {
        // The code you> place here will be executed every time your command is executed
        // Display a message box to the user
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        // let text = activeEditor.selections.map((selection) => activeEditor!.document.getText(selection));
        let text = editor.document.getText(editor.selection);
        const tlv = new TlvFormatter();
        let new_text = tlv.format(text);
        editor.edit((selectedText) => {
            if (editor)
                selectedText.replace(editor.selection, new_text);
        });
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map