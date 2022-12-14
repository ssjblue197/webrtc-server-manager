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
            :id="`mse-video${this.streamID + 'video' + this.channelSelected.name}`" autoplay muted playsinline width="100%" @dblclick="viewStream()"></video>
          <div
            v-show="showIconReload"
            style="display: flex; flex-direction: row; text-align: center; justify-items: center; justify-content: center; height: 210px; padding-top: 80px;">
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
import APP_CONFIG from '../config.js';
import { convertUrlWs, Utf8ArrayToStr } from '../common.js';

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
        countRetry: 3,
        showIconReload: false,
        replayTimeout: null,
        ws:null,
        mseSourceBuffer:null,
        mse:null,
        mseQueue:[],
        mseStreamingStarted:false,
    }
  },
  watch: {
    channels() {
      if (this.channels.length > 0) {
        this.channelSelected = {
          name: this.channels[0].name,
          url: this.channels[0].mseUrl
        }
      }
    }
  },
  created() {
    if (this.channels.length > 0) {
      this.channelSelected = {
        name: this.channels[0].name,
        url: this.channels[0].mseUrl
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
      // console.log('Reload Channel:', this.streamID + '/' + this.channelSelected.name);
      this.$toast.info(`Reload Channel: ${this.streamID + '/' + this.channelSelected.name}`);
      this.showIconReload = false;
      this.countRetry = 1;
      await this.closeStream();
      await this.startPlay();
    },
    viewStream() {
      this.$emit('showPlayer', { selectChannel: this.channelSelected, type: 'mse' });
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
              url: item.mseUrl
            },
          })
        }
      }
      return opts
    },
    async closeStream() {
      if(this.ws!=null){
        //close WebSocket connection if opened
        this.ws.close(1000);
        this.ws=null;
      }
      this.isClosed = true;
    },
    async startPlay() {
      this.mse = new MediaSource();
      this.isClosed = false;
      this.isRebooting = false;
      // this.$toast.success(`Start Stream: ${this.streamID} / ${this.channelSelected.name}`);
      let videoID = '#mse-video' + this.streamID + 'video' + this.channelSelected.name;
      // console.log(videoID);
      let videoEl = document.querySelector(videoID);
      this.currentUrl = convertUrlWs(APP_CONFIG.BASE_URL + this.channelSelected.url);
      console.log('this.currentUrl', this.currentUrl);
      const _this  = this;
      videoEl.src = window.URL.createObjectURL(this.mse);
      this.mse.addEventListener('sourceopen', function(){
        _this.ws=new WebSocket(_this.currentUrl);
        _this.ws.binaryType = "arraybuffer";
        _this.ws.onopen = function(e) {
          console.log('Connect to ws', e);
        }

        _this.ws.onmessage = function(event) {
          let data = new Uint8Array(event.data);
            if (data[0] == 9) {
              let decoded_arr = data.slice(1);
              let mimeCodec = null;
              if (window.TextDecoder) {
                mimeCodec = new TextDecoder("utf-8").decode(decoded_arr);
              } else {
                mimeCodec = Utf8ArrayToStr(decoded_arr);
              }
              // console.log(mimeCodec);
              _this.mseSourceBuffer = _this.mse.addSourceBuffer('video/mp4; codecs="' + mimeCodec + '"');
              _this.mseSourceBuffer.mode = "segments"
              _this.mseSourceBuffer.addEventListener("updateend", _this.pushPacket);

            } else {
              _this.readPacket(event.data);
            }
          };
      }, false);
    },
    pushPacket(){
      if (!this.mseSourceBuffer.updating) {
        if (this.mseQueue.length > 0) {
          let packet = this.mseQueue.shift();
          // var view = new Uint8Array(packet);
          this.mseSourceBuffer.appendBuffer(packet);
        } else {
          this.mseStreamingStarted = false;
        }
      }
    },
    readPacket(packet){
      if (!this.mseStreamingStarted) {
        this.mseSourceBuffer.appendBuffer(packet);
        this.mseStreamingStarted = true;
        return;
      }
      this.mseQueue.push(packet);

      if (!this.mseSourceBuffer.updating) {
        this.pushPacket();
      }
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
  height: 200px;
  border-radius: 5px;
}
.playerWrap {
  display: block;
  overflow: hidden;
  box-shadow: 0 3px 10px rgb(0 0 0 / 0.2);
  border-radius: 5px;
}
</style>