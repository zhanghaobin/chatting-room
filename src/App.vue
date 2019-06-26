<template>
    <div id="app">
        <div id="mask" v-show="mask"></div>
        <main id="main">
            <chatting-box id="chatting-box" :socket="this.socket"></chatting-box>
            <section id="dialog" class="card-layout" v-show="mask">
                <img id="icon-warn" src="./assets/images/icon-warn.png" alt="icon-warn" draggable="false"
                     @drag.prevent/>
                <span id="title-warn">Notice</span>
                <p id="content-warn">未连接到服务器或与服务器断开连接。</p>
                <button id="connect" :class="{connecting}" @click="connect">{{this.msg}}</button>
            </section>
        </main>
    </div>
</template>

<script>
    import ChattingBox from "./components/chatting-box";

    export default {
        name: "App",
        components: {
            ChattingBox
        },
        data() {
            return {
                socket: null,
                state: -1
            };
        },
        computed: {
            msg() {
                return this.connecting ? "连接中..." : "立即连接";
            },
            mask() {
                return this.state !== WebSocket.OPEN;
            },
            connecting() {
                return this.state === WebSocket.CONNECTING;
            }
        },
        methods: {
            connect() {
                if (this.connecting) return;
                this.socket = new WebSocket(`ws://${location.host}/chatting-room`); // 通过proxyTable代理
                this.state = this.socket.readyState;
                this.socket.addEventListener("open", this.updateState);
                this.socket.addEventListener("error", this.updateState);
                this.socket.addEventListener("close", this.updateState);
            },
            updateState() {
                this.state = this.socket.readyState;
            }
        }
    };
</script>

<style src="./assets/styles/app.css"></style>
