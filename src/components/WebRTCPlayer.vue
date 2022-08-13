<template>
    <div class="mb-4 ml-2 mr-2 playerWrap" :style="isRebooting ? 'background-color: white; opacity: 0.3;' : ''">
        <div style="position: fixed; left: 50%; top: 40%;" v-if="isRebooting">
            <b-spinner variant="primary" label="Spinning"></b-spinner>
        </div>
        <b-row style="position: absolute; z-index: 1; margin-top: -25px;">
          <b-col cols="1" v-if="isClosed">
            <b-icon icon="play-circle-fill" variant="success"
              @click="startPlay()"
            >
            </b-icon>
          </b-col>
          <b-col cols="1" v-else>
            <b-icon icon="pause-circle-fill" variant="danger"
              @click="stopStream()"
            >
            </b-icon>
          </b-col>
          <b-col cols="1">
            <b-icon icon="gear-fill" variant="primary" @click="showMenu = !showMenu"
              :animation="hoverSetting ? 'spin' : ''"
              v-b-hover="hoverSettingAct"
            >
            </b-icon>
          </b-col>
          <!-- <b-col cols="1">
            <b-icon icon="arrow-clockwise" variant="secondary"
              :animation="hoverReload ? 'spin' : ''"
              v-b-hover="hoverReloadAct"
              @click="reloadChannel()"
            >
            </b-icon>
          </b-col> -->
  
        </b-row>
        <div v-if="showMenu" class="middelItem">
          <b-form-radio-group
            v-model="channelSelected"
            :options="genOptions(this.channels)"
            @change="changeChannel"
          ></b-form-radio-group>
        </div>
        <b-row style="display: block; margin-bottom: -10px; background-color: #B3B8BC;"> 
          <video 
            v-show="!showIconReload"
            poster="../assets/playing.svg"
            :style="'height:' + this.height"
            :id="`webrtc-video${this.streamID + 'video' + this.channelSelected.name}`" autoplay muted playsinline width="100%" @dblclick="viewStream()"></video>
          <div
            v-show="showIconReload"
            style="display: flex; flex-direction: row; text-align: center; justify-items: center; justify-content: center; height: 210px; padding-top: 80px;"
            >
            <b-icon icon="arrow-clockwise" variant="secondary"
              :animation="hoverReload ? 'spin' : ''"
              v-b-hover="hoverReloadAct"
              style="width: 40px; height: 40px;"
              @click="reloadChannel()"
            >
            </b-icon>
        </div>
        </b-row>
    </div>
</template>

<script>
// let webrtc, webrtcSendChannel, webrtcSendChannelInterval;
import APP_CONFIG from '../config.js'


export default {
  name: 'Player',
  props: {
    channels: Array,
    streamID: String,
    height: {
      type: String,
      default: '200px'
    }
  },
  data() {
    return {
        channelSelected: {},
        isRebooting: true,
        webrtc: null,
        webrtcSendChannel: null,
        webrtcSendChannelInterval: null,
        showMenu: false,
        currentUrl: '',
        isClosed: false,
        hoverReload: false,
        hoverSetting: false,
        countRetry: 2,
        showIconReload: false,
        replayTimeout: null
    }
  },
  watch: {
    channels() {
      if (this.channels.length > 0) {
        this.channelSelected = {
          name: this.channels[0].name,
          url: this.channels[0].webrtcUrl
        }
      }
    }
  },
  created() {
    if (this.channels.length > 0) {
      this.channelSelected = {
        name: this.channels[0].name,
        url: this.channels[0].webrtcUrl
      }
    }
  },
  mounted: function() {
    this.$nextTick(async function() {
        await this.startPlay();
    });
  },
  beforeDestroy() {
    console.log('DESTROYED');
    clearInterval(this.webrtcSendChannelInterval);
    if (this.replayTimeout) {
      clearTimeout(this.replayTimeout);
      this.replayTimeout = null;
    }
    this.webrtcSendChannelInterval = null;
    this.closeStream();
  },
  methods: {
    async stopStream() {
      this.$toast.error(`Stop Channel: ${this.channelSelected.name}`);
      await this.closeStream();
    },
    hoverReloadAct(hovered) {
      this.hoverReload = hovered;
    },
    hoverSettingAct(hovered) {
      this.hoverSetting = hovered;
    },
    async reloadChannel() {
      console.log('Reload Channel:', this.streamID + '/' + this.channelSelected.name);
      this.$toast.info(`Reload Channel: ${this.streamID + '/' + this.channelSelected.name}`);
      this.showIconReload = false;
      this.countRetry = 1;
      await this.closeStream();
      await this.startPlay();
    },
    viewStream() {
      this.$emit('showPlayer', { selectChannel: this.channelSelected, type: 'webrtc' });
    },
    async changeChannel(e) {
      console.log(e);
      this.showMenu = false;
      this.showIconReload = false;
      this.countRetry = 1;
      await this.closeStream();
      await this.startPlay();
      this.$toast.info(`Change Channel: ${this.channelSelected.name}`);
    },
    genOptions(arr) {
      let opts = [];
      if (arr.length > 0) {
        for (const item of arr) {
          opts.push({
            text: item.name,
            value: {
              name: item.name,
              url: item.webrtcUrl
            },
          })
        }
      }
      return opts
    },
    async closeStream() {
      if (this.webrtcSendChannel !== null) {
        this.webrtcSendChannel.close();
        this.webrtcSendChannel = null;
      }
      if (this.webrtc !== null) {
        this.webrtc.close();
        this.webrtc = null;
      }
      this.isClosed = true;
    },
    async startPlay() {
      this.isClosed = false;
      this.isRebooting = false;
      // this.$toast.success(`Start Stream: ${this.streamID} / ${this.channelSelected.name}`);
      let videoID = '#webrtc-video' + this.streamID + 'video' + this.channelSelected.name;
      // console.log(videoID);
      let videoEl = document.querySelector(videoID);
      this.webrtc = new RTCPeerConnection({
      iceServers: [{
          urls: APP_CONFIG.STUN_SERVER
      }],
      sdpSemantics: 'unified-plan'
      });
      this.webrtc.onnegotiationneeded = await this.handleNegotiationNeeded;
      this.webrtc.ontrack = function(event) {
        console.log(event.streams.length + ' track is delivered');
        videoEl.srcObject = event.streams[0];
        videoEl.play();
      }
      this.webrtc.onconnectionstatechange = async function(event) {
        switch(event.currentTarget.connectionState) {
          case "connected":
            console.log('[CONNECTION IS CONNETED]');
            // The connection has become fully connected
            break;
          case "disconnected":
            console.log('[CONNECTION IS DISCONNETED]');
            await this.closeStream();
            await this.startPlay();
            break;
          case "failed":
            console.log('[OTHERS ERROR CAUSE]');
            break;
          case "closed":
            console.log('[CONNECTION IS CLOSED]');
            // The connection has been closed
            break;
        }
      };
      this.webrtc.oniceconnectionstatechange = function(event) {
          // console.log('[ICE EVENT ONCHANGE]', event);
          if (event.currentTarget.iceConnectionState === "failed" ||
              event.currentTarget.iceConnectionState === "disconnected" ||
              event.currentTarget.iceConnectionState === "closed") {
                  // console.log('[ICE UPDATE STATE]', event.currentTarget.iceConnectionState);
                  this.webrtc.restartIce();
          }
      };
      this.webrtc.addTransceiver('video', {
      'direction': 'sendrecv'
      });
      // this.webrtcSendChannel = this.webrtc.createDataChannel('sendchannel');
      // this.webrtcSendChannel.onopen = () => {
      // console.log('sendChannel has opened');
      // // this.webrtcSendChannel.send('ping');
      // // this.webrtcSendChannelInterval = setInterval(() => {
      // //     this.webrtcSendChannel.send('ping');
      // // }, 1000)
      // }
      // this.webrtcSendChannel.onmessage = e => console.log(e.data);
    },
    async handleNegotiationNeeded() {
      this.currentUrl = APP_CONFIG.BASE_URL + this.channelSelected.url;
      let offer = await this.webrtc.createOffer();
      await this.webrtc.setLocalDescription(offer);
      // console.log(this.webrtc);
      await fetch(this.currentUrl, {
          method: 'POST',
          body: new URLSearchParams({
              data: btoa(this.webrtc.localDescription.sdp)
          })
      })
      .then(response => response.text())
      .then(data => {
        // console.log(data);
        try {
            this.webrtc.setRemoteDescription(new RTCSessionDescription({
              type: 'answer',
              sdp: atob(data)
            }))
        } catch (e) {
            // console.warn(e);
            if (this.countRetry === 0) {
              this.$toast.error(`Không có tín hiệu luồng stream: ${this.streamID}/${this.channelSelected.name}`);
            }
            if (this.countRetry > 0) {
                this.replayTimeout = setTimeout(async () => {
                  await this.closeStream();
                  await this.startPlay();
                }, 5000);
                // console.log('[CON LAI SO LAN THU]:',this.countRetry);
                this.countRetry--;
            } else {
                // console.log('SHOW ICON RELOAD');
                this.showIconReload = true;
                if (this.replayTimeout) {
                  clearTimeout(this.replayTimeout);
                  this.replayTimeout = null;
                }
            }
        }
    })
    },
  }
}
</script>

<style scoped>
.middelItem {
  box-sizing: border-box;
  display: flex;
  justify-content: start;
  align-items: start;
  align-self: start;
  align-content: flex-start;
  position: absolute;
  z-index: 900;
  margin-left: 0px;
  background-color: rgba(153, 146, 146, 0.9);
  border-radius: 5px 0px 5px 0px;
  color: black;
  padding: 5px;
}
video {
  object-fit: cover;
  border-radius: 5px;
}
.playerWrap {
  display: block;
  overflow: hidden;
  box-shadow: 0 3px 10px rgb(0 0 0 / 0.2);
  border-radius: 5px;
}
</style>