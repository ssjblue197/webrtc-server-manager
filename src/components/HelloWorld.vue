<template>
  <b-container>
    <div style="position: fixed; left: 50%; top: 40%;" v-if="isRebooting">
        <b-spinner variant="primary"></b-spinner><br>
          Loading data
    </div>
    <transition name="show">
      <b-row class="justify-content-md-start pt-0 pb-0" style="margin-top:80px; margin-bottom:60px;" v-if="!isRebooting">
        <b-col col xl="3"  lg="3" md="4" sm="6" xs="6" v-for="(stream, index) in this.streamListDisplay" :key="index">
          <span style="font-weight: bold; margin-left: 20px;">
            Stream: {{ stream.name }} / {{ stream.channels.length }} channels
          </span>
            <Player :channels="stream.channels"
              :streamID="stream.name"
              @showPlayer="showPlayer"
            />
        </b-col>
      </b-row>
    </transition>
    <div style="position: fixed; top: 40vh; left: 40px; z-index: 1010;" v-if="this.currentPage !== 1">
      <b-icon icon="arrow-left-circle-fill" variant="info"
      class="btn-paginate"
      @click="previousPage()"
      style="width: 60px; height: 60px; opacity: 0.8;"
      >
      </b-icon>
    </div>
    <div style="position: fixed; top: 40vh; right: 40px; z-index: 1010;">
      <b-icon icon="arrow-right-circle-fill" v-if="this.currentPage !== this.totalPage" variant="info"
      class="btn-paginate"
      @click="nextPage()"
      style="width: 60px; height: 60px; opacity: 0.8;"
      >
      </b-icon>
    </div>
    <div style="width: 10%; position: fixed; top: 80px; left: 20px; background-color: rgba(81, 209, 232, 0.4); border-radius: 5px; padding: 10px; ">
      <div style="pointer-events: none; font-weight: bold; pointer-events:none;">
        Thống kê nhanh
      </div>
      <div style="pointer-events: none;">
        Số luồng stream: {{ this.streamList.length }}
      </div>
      <div style="pointer-events:none;">
        Số channels: {{ countChannels(this.streamList) }}
      </div>
      <div style="pointer-events:none;">
        Trang hiện tại: {{ this.currentPage }} / {{ this.totalPage }}
      </div>
      <hr>
      <b-button variant="outline-primary" size="sm" v-on:click="openManageModal">Quản lý</b-button>
    </div>
    <modal name="previewModal" 
      draggable=".contentPreview"
      width="900px"
      height="506px"
      >
      <div class="contentPreview" style="border-radius: 5px;">
        <b-icon icon="x-circle-fill" variant="danger"
          style="position: absolute; z-index: 1001; top: 5px; right: 5px;"
          @click="closeStream()"
        ></b-icon>
        <b-icon icon="arrows-fullscreen" variant="info"
          style="position: absolute; z-index: 1001; bottom: 5px; right: 5px;"
          @click="viewFullScreen()"
        >
        </b-icon>
        <img src="../assets/spinner.gif" style="margin-top: 100px;" v-show="loadingPreview">
        <video 
        poster="../assets/video_poster.jpg"
        id="webrtc-video-modal" autoplay muted playsinline width="100%" v-show="!loadingPreview"></video>
      </div>
    </modal>
    <modal name="manageModal" 
      draggable=".manageModal"
      width="900px"
      height="600px"
      >
      <div style="font-size: 20px;font-weight: bold; position: absolte; background-color: gray; color: white; padding: 5px;">
        Quản lý luồng WebRTC
      </div>
      <b-button 
        @click="addStream()"
      variant="success" style="position: absolute; right: 5px; top: 5px;" size="sm">Thêm</b-button>
      <div class="manageContent">
        <div class="manageModal pb-1" style="border-radius: 5px; padding: 10px; padding-left: 20px; padding-right: 20px;"
          v-for="(stream, index) in streamList"
          :key="index"
        >
          <b-row>
            <b-col cols="4">
              Stream: {{ stream.name }}
            </b-col>
            <b-col cols="3">
              Số channels: {{ stream.channels.length }}
            </b-col>
            <b-col></b-col>
            <b-col cols="3">
              <span>
                <b-button
                  @click="editStream(stream)"
                 variant="outline-primary" style="margin-right: 10px;" size="sm">Sửa</b-button>
                <b-button variant="outline-danger" size="sm">Xóa</b-button>
              </span>
            </b-col>
          </b-row><hr>
        </div>
      </div>
    </modal>
    <modal name="streamModal" 
      draggable=".streamModal"
      width="600px"
      height="400px"
      >
      <div style="font-size: 20px;font-weight: bold; position: absolte; background-color: gray; color: white; padding: 5px;">
        {{ action === 'add' ? 'Tạo mới luồng WebRTC' : 'Chỉnh sửa luồng WebRTC' }}
      </div>
      <b-button v-if="action === 'add'"
      variant="success" style="position: absolute; right: 5px; top: 5px;" size="sm" @click="add(form)">Lưu</b-button>
      <b-button v-else
      variant="success" style="position: absolute; right: 5px; top: 5px;" size="sm" @click="update(form)">Cập nhật</b-button>
      <div class="streamModal">
        <b-row>
          <b-col cols="4">Tên luồng</b-col>
          <b-col cols="7">
            <b-input placeholder="Nhập tên luồng" v-model="form.name"/>
          </b-col>
        </b-row><hr>
        <b-row>
          <b-row>
            <b-col cols="4">Tên channel</b-col>
            <b-col cols="7">RTSP Link</b-col>
          </b-row>
          <b-row v-for="(item, index) in form.channels" :key="index" style="margin-left: 20px; margin-bottom: 5px;">
            <b-col cols="4" style="margin-right: 5px;">
              <b-row>
                <b-input placeholder="Nhập tên channel" v-model="item.name"/>
              </b-row>
            </b-col>
            <b-col cols="7">
              <b-row>
                <b-input placeholder="Nhập RTSP Link" v-model="item.url"/>
              </b-row>
            </b-col>
          </b-row>
        </b-row><br>
        <b-button variant="success" @click="addChannel()" v-if="form.channels && form.channels.length < 5">
          <b-icon-plus-circle/>
        </b-button>
      </div>
    </modal>
  </b-container>
</template>

<script>
import axios from 'axios';
import Player from './WebRTCPlayer'
import APP_CONFIG from '../config.js'
export default {
  name: 'HelloWorld',
  components: {
    Player
  },
  props: {
    // msg: String
  },
  data() {
    return {
      streamList: [],
      selectPlayer: {},
      webrtc: null,
      webrtcSendChannel: null,
      webrtcSendChannelInterval: null,
      currentUrl: '',
      isRebooting: false,
      perPage: 12,
      streamListDisplay: [],
      currentPage: 1,
      totalPage: 0,
      loadingPreview: false,
      showStreamList: [],
      action: 'add',
      form: {}
    }
  },
  mounted: function() {
    this.$nextTick(async function() {
      await this.getListCamWebRTC();
    });
  },
  watch: {
    currentPage() {
      let resultDisplay = [];
      if (this.streamList.length > 0) {
        this.totalPage = Math.ceil(this.streamList.length / this.perPage);
        console.log('SO TRANG:',this.totalPage);
        console.log('TRANG HIEN TAI', this.currentPage);
        if (this.currentPage < this.totalPage) {
          let start = (this.currentPage - 1) * this.perPage;
          let end = this.currentPage * this.perPage;
          resultDisplay = this.streamList.slice(start, end);
        } else {
          let start = (this.currentPage - 1) * this.perPage;
          let end = this.streamList.length;
          resultDisplay = this.streamList.slice(start, end);
        }
      }
      this.streamListDisplay = resultDisplay;
      setTimeout(() => {
        this.isRebooting = false;
      }, 300)
    }
  },
  beforeDestroy() {
    clearInterval(this.webrtcSendChannelInterval);
    this.webrtcSendChannelInterval = null;
    this.closeStream();
  },
  methods: {
    add(data) {
      console.log(data);
      // axios.post(APP_CONFIG.BASE_URL + APP_CONFIG.API_ENPOINT.ADD_STREAM + '/' + data.name + '/add',data,{
      //   auth: {
      //     username: APP_CONFIG.BASIC_AUTH.USERNAME,
      //     password: APP_CONFIG.BASIC_AUTH.PASSWORD
      //   }
      // }).then(res => {
      //   console.log(res);
      // })
    },
    addChannel() {
      this.form.channels.push({
        name: '',
        url: '',
        on_demand: true
      });
    },
    addStream() {
      this.action = 'add';
      this.$modal.show('streamModal');
      this.form = {
        name: '',
        channels: [{
          name: '',
          url: '',
          on_demand: true
        }]
      }
    },
    editStream(stream) {
      this.action = 'edit';
      this.form = stream;
      this.$modal.show('streamModal');
    },
    showStreamConfig(id) {
      console.log(id);
      console.log(this.showStreamList);
      this.showStreamList[id] = true;
      console.log(this.showStreamList);
    },
    getIDStream(val) {
      return '#' + String(val);
    },
    openManageModal() {
      this.$modal.show('manageModal');
    },
    viewFullScreen() {
      let elem = document.getElementById("webrtc-video-modal");
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
      }
    },
    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.isRebooting = true;
      } else {
        this.$bvToast.toast('Trang đầu rồi!!',{
          autoHideDelay: 3000,
          solid: true,
          variant: 'warning',
          noCloseButton: true,
          noAutoHide: true
        });
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPage) {
        this.currentPage++;
        this.isRebooting = true;
      } else {
        this.$bvToast.toast('Trang cuối rồi!!',{
          autoHideDelay: 3000,
          solid: true,
          variant: 'warning',
          noCloseButton: true,
          noAutoHide: true
        });
      }
    },
    countChannels(arr) {
      let result = 0;
      for (var i = 0; i < arr.length; i++) {
        result += arr[i].channels.length;
      }
      return result
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
      // this.$bvModal.hide('playerModal');
      this.$modal.hide('previewModal');
    },
    async startPlay() {
      this.webrtc = new RTCPeerConnection({
      iceServers: [{
          urls: APP_CONFIG.STUN_SERVER
      }],
      sdpSemantics: 'unified-plan'
      });
      this.webrtc.onnegotiationneeded = await this.handleNegotiationNeeded;
      this.webrtc.ontrack = function(event) {
        console.log(event.streams.length + ' track is delivered');
        let videoEl = document.querySelector('#webrtc-video-modal');
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
      let url = APP_CONFIG.BASE_URL + this.currentUrl;
      console.log(url);
      let offer = await this.webrtc.createOffer();
      await this.webrtc.setLocalDescription(offer);
      // console.log(this.webrtc);
      await fetch(url, {
          method: 'POST',
          body: new URLSearchParams({
              data: btoa(this.webrtc.localDescription.sdp)
          })
      })
      .then(response => response.text())
      .then(data => {
        try {
            this.webrtc.setRemoteDescription(new RTCSessionDescription({
              type: 'answer',
              sdp: atob(data)
            }))
            setTimeout(() => {
              this.loadingPreview = false;
            }, 1000);
        } catch (e) {
            console.warn(e);
        }
    })},
    async showPlayer({ selectChannel }) {
      console.log(selectChannel);
      this.loadingPreview = true;
      this.currentUrl = selectChannel.url;
      console.log('CURRENT URL:', this.currentUrl);
      console.log(this.loadingPreview);
      await this.startPlay();
      // this.$bvModal.show('playerModal');
      this.$modal.show('previewModal');
    },
    async getListCamWebRTC() {
      this.isRebooting = true;
      axios.get(APP_CONFIG.BASE_URL + APP_CONFIG.API_ENPOINT.STREAMS,{
        auth: {
          username: APP_CONFIG.BASIC_AUTH.USERNAME,
          password: APP_CONFIG.BASIC_AUTH.PASSWORD
        }
      }).then(res => {
        this.isRebooting = false;
        // this.streamList = res.data.payload;
        // console.log(this.streamList);
        console.log(res.data.payload);
        const tmp = [];
        this.showStreamList = [];
        for (const stream in res.data.payload) {
          this.showStreamList.push(false);
          const channels = [];
          if ("channels" in res.data.payload[stream]) {
            if (Object.keys(res.data.payload[stream].channels).length > 0) {
              for (const channel in res.data.payload[stream].channels) {
                channels.push({
                  name: channel,
                  url: '/stream/' + stream + '/channel/' + channel + '/webrtc?uuid=' + stream + '&channel=' + channel
                })
              }
            }
            tmp.push({
              name: stream,
              channels: channels,
            })
          }
        }
        this.streamList = tmp;
        console.log(this.streamList);
        let resultDisplay = [];
        if (this.streamList.length > 0) {
          this.totalPage = Math.ceil(this.streamList.length / this.perPage);
          console.log('SO TRANG:',this.totalPage);
          console.log('TRANG HIEN TAI', this.currentPage);
          if (this.currentPage < this.totalPage) {
            let start = (this.currentPage - 1) * this.perPage;
            let end = this.currentPage * this.perPage;
            resultDisplay = this.streamList.slice(start, end);
          } else {
            let start = (this.currentPage - 1) * this.perPage;
            let end = this.streamList.length;
            resultDisplay = this.streamList.slice(start, end);
          }
        }
        this.streamListDisplay = resultDisplay;
        // console.log(this.streamList);
      })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.container {
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
}
.btn-paginate {
  border-radius: 50%;
}
.btn-paginate:active {
  background-color: lime;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
.show-enter-active,
.show-leave-enter {
    transform: translateX(0);
    transition: all 0.3s linear;
}
.show-enter,
.show-leave-to {
    transform: translateX(100%);
}
.manageContent::-webkit-scrollbar-track
{
	-webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
	border-radius: 10px;
	background-color: #F5F5F5;
}

.manageContent::-webkit-scrollbar
{
	width: 8px;
	background-color: #F5F5F5;
}

.manageContent::-webkit-scrollbar-thumb
{
	border-radius: 10px;
	-webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
	background-color: #42b983;
}

video {
  object-fit: cover;
  /* border-radius: 5px; */
  min-width: 900px;
}

.modalPreview {
  padding: 0px;
}
b-modal > .modal-body {
  padding: 0px;
}
.contentPreview {
  display: flex;
  justify-content: center;
  align-content: center;
  align-items: center;
}

.manageContent {
  max-height: 580px;
  overflow-y: scroll;
  padding-top: 10px;
  font-weight: bold;
}
.streamModal {
  padding-top: 10px;
  font-weight: bold;
}
</style>
