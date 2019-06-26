<template>
    <section class="chatting-box card-layout">
        <section id="information">
            <header>
                <img id="icon-information" src="./../assets/images/icon-info.png" alt="icon-info" draggable="false"
                     @drag.prevent/>
                <span id="title-information">information</span>
            </header>
            <main>
                <p>当前IP：{{information.ip}}</p>
                <p>在线人数：{{information.online}}</p>
                <p>总发言数：{{information.speeches}}</p>
                <p>我的发言：{{information.mySpeeches}}</p>
            </main>
        </section>
        <section id="main-part">
            <header>
                <img id="icon-main" src="./../assets/images/icon-chat.png" alt="icon-chat" draggable="false"
                     @drag.prevent/>
                <span id="title-main">Chatting room</span>
            </header>
            <main ref="main">
                <msg-box v-for="(msg, i) in messages" :msg="msg" :key="'msg-box-' + i" @retry="retry"></msg-box>
            </main>
            <footer>
                <rich-text-editor id="rich-text-editor" @send="onSend" @image-selected="imgSelected"
                                  ref="editor"></rich-text-editor>
            </footer>
        </section>
    </section>
</template>

<script>
    import MsgBox from "./msg-box";
    import RichTextEditor from "./rich-text-editor";

    export default {
        name: "chatting-box",
        props: {
            socket: {
                required: true
            }
        },
        components: {
            MsgBox,
            RichTextEditor
        },
        data() {
            return {
                information: {
                    ip: "0.0.0.0",
                    online: 0,
                    speeches: 0,
                    mySpeeches: 0
                },
                messages: []
            };
        },
        computed: {
            address() {
                return this.information.ip;
            }
        },
        methods: {
            pushMessage(msg) {
                let content = msg.content;
                msg.content = content
                    .replace(/\&/g, "&amp;")
                    .replace(/\#/g, "&#35;")
                    .replace(/\%/g, "&#37;")
                    .replace(/\\/g, "&#92;")
                    .replace(/\</g, "&lt;")
                    .replace(/\>/g, "&gt;")
                    .replace(/\"/g, "&quot;")
                    .replace(/\(emoji:(\d+)\)/g,
                        (undefined, id) => `<img class="emoji" src="/static/emoji/${id}.gif" alt="(emoji:${id})" draggable="false"/>`)
                    .replace(/\(image:(data:image\/.*)\)/g,
                        (undefined, data) => `<img class="image" src="${data}" alt="[image]" draggable="false"/>`);
                return this.messages.push(msg) - 1;
            },
            send(type, data) {
                this.socket.send(
                    JSON.stringify({
                        type,
                        data
                    })
                );
            },
            onSend(msg, timeout = 5000) {
                let id = this.pushMessage({
                    content: msg,
                    sender: this.address,
                    sent: false,
                    failed: false,
                    mime: true,
                    timeout
                });
                this.send("message", {
                    msg,
                    id
                });
            },
            retry(callback) {
                callback(({content, id}) => {
                    this.send("message", {
                        msg: content,
                        id: id
                    });
                });
            },
            onmessage(event) {
                let {type, data} = JSON.parse(event.data);
                switch (type) {
                    case "message":
                        this.pushMessage({
                            content: data.msg,
                            sender: data.sender
                        });
                        break;
                    case "ack":
                        this.ackMessage(data);
                        break;
                    default:
                        console.log(data);
                        break;
                }
                this.updateInformation(data);
            },
            ackMessage(data) {
                let msg = this.messages[data.id];
                msg && (msg.sent = true);
            },
            updateInformation(data) {
                for (let key in data) {
                    if (this.information.hasOwnProperty(key)) {
                        (this.information[key] = data[key]);
                    }
                }
            },
            initSocket() {
                if (!this.socket) return;
                this.socket.addEventListener("message", this.onmessage);
                this.socket.addEventListener("open", () => this.send("update-information"));
            },
            imgSelected(event) {
                let files = event.target.files;
                for (let file of files) {
                    let reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = (event) => {
                        this.onSend(`(image:${event.target.result})`, event.total > 50000 ? event.total / 10 : 5000);
                    };
                }
            }
        },
        watch: {
            socket() {
                this.initSocket();
            },
            messages(messages) {
                let anchor = this.$refs.main;
                messages.length && this.$nextTick(() => anchor.lastChild.scrollIntoView(false));
            }
        },
        mounted() {
            this.initSocket();
        }
    }
</script>

<style scoped src="./../assets/styles/chatting-box.css"></style>

