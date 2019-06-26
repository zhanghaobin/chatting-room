<template>
    <section class="msg-box" :class="{'msg-box-mime': msg.mime}">
        <section id="head-icon" :class="{'head-icon-mime': msg.mime}">
            <span class="default-icon">#</span>
        </section>
        <span id="sender" :class="{'sender-mime': msg.mime}">{{msg.sender + ""}}</span>
        <img id="icon-loading" v-if="msg.mime && !msg.sent" @click="onClick"
             :class="{rotate: !msg.failed}"
             :src="src" alt="icon-loading" draggable="false" @drag.prevent/>
        <section id="msg" :class="{'msg-mime': msg.mime}" v-html="msg.content"></section>
    </section>
</template>

<script>
    export default {
        name: "msg-box",
        props: {
            msg: {
                required: true,
                type: Object
            }
        },
        computed: {
            src() {
                return `/static/images/icon-${this.msg.failed ? 'fail' : 'loading'}.png`;
            }
        },
        methods: {
            onClick() {
                this.msg.failed && this.$emit("retry", (send) => {
                    send(this.msg);
                    this.msg.failed = false;
                    this.setTimer();
                });
            },
            setTimer() {
                let timeout = this.msg.timeout;
                timeout && setTimeout(() => !this.msg.sent && (this.msg.failed = true),timeout);
            }
        },
        mounted() {
            this.setTimer();
        }
    }
</script>

<style scoped src="./../assets/styles/msg-box.css"></style>
