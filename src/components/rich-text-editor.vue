<template>
    <section class="rich-text-editor">
        <section id="tool-bar">
            <emoji-picker id="emoji-picker" @emoji-picked="emojiPicked" v-show="this.emojiPicker"
                          :prefix="emojiPrefix"></emoji-picker>
            <button id="emoji" @click="toggleEmojiPicker"></button>
            <button id="image"><input id="image-selector" type="file" accept="image/*" @change="$emit('image-selected', $event)"/></button>
        </section>
        <pre class="editor" contenteditable="true" ref="editor" @paste.prevent="onPaste"
             @keyup.ctrl.enter.exact="breakLine" @keyup.enter.exact="onConfirm"></pre>
        <button id="confirm" @click="onConfirm">发送</button>
    </section>
</template>

<script>
    import EmojiPicker from "./../components/emoji-picker";

    export default {
        name: "rich-text-editor",
        components: {
            EmojiPicker
        },
        data() {
            return {
                emojiPicker: false,
                emojiPrefix: "emoji-picker-"
            };
        },
        methods: {
            emojiPicked(event) {
                let selection = window.getSelection(),
                    node = event.target.cloneNode(true);
                if (!selection.rangeCount || selection.focusNode !== this.$refs.editor) {
                    this.$refs.editor.appendChild(node);
                    this.emojiPicker = false;
                    return this.$refs.editor.focus();
                }
                selection.deleteFromDocument();
                let range = selection.getRangeAt(0);
                range.insertNode(node);
                this.$refs.editor.focus();
                range.collapse(false);
                this.emojiPicker = false;
            },
            toggleEmojiPicker() {
                this.emojiPicker = !this.emojiPicker;
            },
            onConfirm() {
                let nodes = this.$refs.editor.childNodes,
                    regexp = new RegExp(`^${this.emojiPrefix}(\\d+)$`),
                    content = [];
                for (let node of nodes) {
                    if (node instanceof Text) {
                        content.push(node.data);
                    } else if (node instanceof Image) {
                        let classes = node.classList,
                            result;
                        for (let cls of classes) {
                            if ((result = regexp.exec(cls))) {
                                content.push(`(emoji:${result[1]})`);
                            }
                        }
                    }
                }
                content.length && this.$emit("send", content.join(""));
                this.$refs.editor.innerHTML = "";
            },
            onPaste(event) {
                let clipboardData;
                if (!(clipboardData = event.clipboardData || window.clipboardData)) return;
                let selection = window.getSelection();
                if (!selection.rangeCount) return;
                selection.deleteFromDocument();
                let data = clipboardData.getData("text/plain").replace(/\r?\n/g, "\r\n");
                selection.getRangeAt(0).insertNode(new Text(data));
                selection.collapseToEnd();
            },
            breakLine() {
                let selection = window.getSelection();
                if (!selection.rangeCount) return;
                selection.deleteFromDocument();
                let line = document.createTextNode("\r\n"),
                    range = selection.getRangeAt(0);
                range.insertNode(line);
                range.collapse(false);
            }
        }
    }
</script>

<style scoped src="./../assets/styles/rich-text-editor.css"></style>
