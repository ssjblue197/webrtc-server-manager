<template>
    <div style="overflow: hidden; box-shadow: 0 3px 10px rgb(0 0 0 / 0.2); border-radius: 5px;" class="mb-4 ml-2 mr-2" :style="isRebooting ? 'background-color: white; opacity: 0.3;' : ''">
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
          <b-col cols="1">
            <b-icon icon="arrow-clockwise" variant="secondary"
              :animation="hoverReload ? 'spin' : ''"
              v-b-hover="hoverReloadAct"
              @click="reloadChannel()"
            >
            </b-icon>
          </b-col>
  
        </b-row>
        <div v-if="showMenu" class="middelItem">
          <b-form-radio-group
            v-model="channelSelected"
            :options="genOptions(this.channels)"
            @change="changeChannel"
          ></b-form-radio-group>
        </div>
        <video 
        poster="../assets/video_poster.jpg"
        :id="`webrtc-video${this.streamID + 'video' + this.channelSelected.name}`" autoplay muted playsinline width="100%" @dblclick="viewStream()"></video>
    </div>
</template>

<script>
// let webrtc, webrtcSendChannel, webrtcSendChannelInterval;
import APP_CONFIG from '../config.js'


export default {
  name: 'Player',
  props: {
    channels: Array,
    streamID: String
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
        hoverSetting: false
    }
  },
  watch: {
    channels() {
      if (this.channels.length > 0) {
        this.channelSelected = {
          name: this.channels[0].name,
          url: this.channels[0].url
        }
      }
    }
  },
  created() {
    if (this.channels.length > 0) {
      this.channelSelected = {
        name: this.channels[0].name,
        url: this.channels[0].url
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
    this.webrtcSendChannelInterval = null;
    this.closeStream();
  },
  methods: {
    stopStream() {
      this.$toast.error(`Stop Channel: ${this.channelSelected.name}`);
      this.closeStream();
    },
    hoverReloadAct(hovered) {
      this.hoverReload = hovered;
    },
    hoverSettingAct(hovered) {
      this.hoverSetting = hovered;
    },
    reloadChannel() {
      console.log('Reload Channel:', this.streamID + '/' +this. channels[0].name);
      this.$toast.info(`Reload Channel: ${this.streamID + '/' +this. channels[0].name}`);
    },
    viewStream() {
      this.$emit('showPlayer', { selectChannel: this.channelSelected });
    },
    async changeChannel() {
      this.showMenu = false;
      this.closeStream();
      await this.startPlay();
      this.$toast.info(`Change Channel: ${this.channelSelected.name}`);
    },
    genOptions(arr) {
      var opts = [];
      if (arr.length > 0) {
        for (const item of arr) {
          opts.push({
            text: item.name,
            value: {
              name: item.name,
              url: item.url
            },
          })
        }
      }
      return opts
    },
    closeStream() {
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
      this.$toast.success(`Start Stream: ${this.streamID} / ${this.channelSelected.name}`);
      let videoID = '#webrtc-video' + this.streamID + 'video' + this.channelSelected.name;
      console.log(videoID);
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
      this.webrtc.addTransceiver('video', {
      'direction': 'sendrecv'
      });
      this.webrtcSendChannel = this.webrtc.createDataChannel('sendchannel');
      this.webrtcSendChannel.onopen = () => {
      console.log('sendChannel has opened');
      this.webrtcSendChannel.send('ping');
      this.webrtcSendChannelInterval = setInterval(() => {
          this.webrtcSendChannel.send('ping');
      }, 1000)
      }
      this.webrtcSendChannel.onmessage = e => console.log(e.data);
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
            console.warn(e);
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
  z-index: 1001;
  margin-left: 0px;
  background-color: rgba(153, 146, 146, 0.9);
  border-radius: 5px 0px 5px 0px;
  color: black;
  padding: 5px;
}
video {
  object-fit: cover;
  height: 200px;
  border-radius: 5px;
}
</style>