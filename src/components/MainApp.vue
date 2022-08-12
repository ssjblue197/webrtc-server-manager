<template>
  <b-container style="overflow: hidden;">
    <div style="position: fixed; left: calc(50% - 50px); top: 40%;" v-if="isRebooting">
        <b-spinner variant="primary"></b-spinner><br>
          Loading data
    </div>
    <transition name="show">
      <b-row class="justify-content-md-start pt-0 pb-0" style="margin-top:80px; margin-bottom:60px; width: 100%;" v-if="!isRebooting">
        <b-col col xl="3"  lg="4" md="4" sm="6" v-for="(stream, index) in this.streamListDisplay" :key="index">
          <b-row style="width: 100%; display: flex; flex-direction: row;">
            <b-col style="flex-grow: 1; white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                padding-left: 60px;
                ">
              <span style="font-weight: bold;">
                Stream: {{ stream.name }} / {{ stream.channels.length }} channels 
              </span>
            </b-col>
            <b-col cols="1" :id="'videoButton'+index">
              <div class="buttonMedia"
                @click="showModeList('#videoButton'+index)"
              >
                <b-icon icon="camera-video-fill" variant="success"
                  v-b-tooltip.hover :title="`Chuyển đổi chế độ phát media. Hiện tại đang chạy: ${stream.playType}`"
                />
              </div>
              <div class="menuPlayMode">
                Chế độ
                <b-form-select
                  v-model="stream.playType"
                  :options="formatList" 
                  @change="changeModePlay(index, '#videoButton'+index)"
                  size="sm" class="mt-3"></b-form-select>
              </div>
            </b-col>
          </b-row>
            <Player
              v-if="stream.playType === 'webrtc'"
              :channels="stream.channels"
              :streamID="stream.name"
              @showPlayer="showPlayer"
            />
            <HLSLLPlayer
              v-if="stream.playType === 'hlsll'"
              :channels="stream.channels"
              :streamID="stream.name"
              @showPlayer="showPlayer"
            />
            <HLSPlayer
              v-if="stream.playType === 'hls'"
              :channels="stream.channels"
              :streamID="stream.name"
              @showPlayer="showPlayer"
            />
            <MSEPlayer
              v-if="stream.playType === 'mse'"
              :channels="stream.channels"
              :streamID="stream.name"
              @showPlayer="showPlayer"
            />
        </b-col>
      </b-row>
    </transition>
    <div style="position: fixed; top: 50vh; left: 40px; z-index: 1010;" v-if="this.currentPage !== 1 && !isRebooting">
      <b-icon icon="arrow-left-circle-fill" variant="info"
      class="btn-paginate"
      @click="previousPage()"
      style="width: 60px; height: 60px; opacity: 0.8;"
      >
      </b-icon>
    </div>
    <div style="position: fixed; top: 50vh; right: 40px; z-index: 1010;" v-if="!isRebooting">
      <b-icon icon="arrow-right-circle-fill" v-if="this.currentPage !== this.totalPage" variant="info"
      class="btn-paginate"
      @click="nextPage()"
      style="width: 60px; height: 60px; opacity: 0.8;"
      >
      </b-icon>
    </div>
    <div
      style="width: 10%; position: fixed; top: 80px; left: 20px; background-color: rgba(81, 209, 232, 0.4); border-radius: 5px; padding: 10px; ">
      <div style="pointer-events: none; font-weight: bold; pointer-events:none;">
        Tìm kiếm
      </div>
      <b-input
        debounce="500"
        v-model="searchText" @keyup.enter="searchStream(searchText)" placeholder="Nhập từ khóa"></b-input>
      <b-row v-if="isSearching" class="mt-2" style="padding-left: 10px;">
        Tìm thấy {{ totalResultSearch }} kết quả.
      </b-row>
    </div>
    <div
      style="width: 10%; position: fixed; top: 200px; left: 20px; background-color: rgba(81, 209, 232, 0.4); border-radius: 5px; padding: 10px; ">
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
      <b-button variant="primary" size="sm" v-on:click="openManageModal">Quản lý</b-button>
    </div>
    <modal name="previewModal" 
      draggable=".contentPreview"
      width="1200px"
      height="675px"
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
        <img src="../assets/spinner.gif" style="margin-top: 180px;" v-show="loadingPreview">
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
        <div class="searchManage">
          <b-input
            debounce="500"
            v-model="searchTextManage" @keyup.enter="searchStreamManage(searchTextManage)" placeholder="Nhập từ khóa"></b-input>
          <b-row class="mt-2" style="padding-left: 10px;">
            Tìm thấy {{ listStreamManageDisplay.length }} kết quả.
          </b-row>
        </div>
        <div class="manageModal pb-1" style="border-radius: 5px; padding: 10px; padding-left: 20px; padding-right: 20px;"
          v-for="(stream, index) in listStreamManageDisplay"
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
                 variant="primary" style="margin-right: 10px;" size="sm">Sửa</b-button>
                <b-button variant="danger" @click="deleteStream(stream)" size="sm">Xóa</b-button>
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
            <b-input placeholder="Nhập tên luồng" v-model="form.name"
              :disabled="action === 'update'"
              :formatter="formatter"
              debounce="500"
              required
            />
          </b-col>
        </b-row><hr>
        <b-row>
          <b-row>
            <b-col cols="1"></b-col>
            <b-col cols="3">Tên channel</b-col>
            <b-col cols="3">RTSP Link</b-col>
            <b-col cols="5" style="padding-right: 35px;">Tính năng</b-col>
          </b-row>
          <b-row v-for="(item, index) in form.channels" :key="index"
            style="margin-left: 20px; margin-bottom: 5px;"
          >
            <b-col cols="1">
              <b-row class="mt-2">
                <b-icon icon="circle-fill" :variant="item.status ? 'success' : 'danger'"
                  v-b-tooltip.hover title="Trạng thái của channel."
                >
                </b-icon>
              </b-row>
            </b-col>
            <b-col cols="2" style="margin-right: 5px;">
              <b-row>
                <b-input required placeholder="Nhập tên channel" v-model="item.name" debounce="500" :formatter="formatter"/>
              </b-row>
            </b-col>
            <b-col cols="3">
              <b-row>
                <b-input placeholder="Nhập RTSP Link" v-model="item.url"/>
              </b-row>
            </b-col>
            <b-col cols="1">
              <b-row>
                <b-button variant="light" @click="onChangeDebug(index)">
                  <b-icon icon="bug-fill" :variant="item.debug ? 'success' : 'normal'"
                    v-b-tooltip.hover title="Tính năng Debug. Bật tính năng này để theo dõi gỡ lỗi."
                  >
                  </b-icon>
                </b-button>
              </b-row>
            </b-col>
            <b-col cols="1">
              <b-row>
                <b-button variant="light" @click="onChangeOnDemand(index)">
                  <b-icon icon="eye-fill" :variant="item.on_demand ? 'success' : 'normal'"
                    v-b-tooltip.hover title="Tính năng Ondemand. Bật tính năng này để tiết kiệm tài nguyên hệ thống."
                  >
                  </b-icon>
                </b-button>
              </b-row>
            </b-col>
            <b-col cols="1">
              <b-row>
                <b-button variant="light" @click="onChangeAudio(index)">
                  <b-icon icon="volume-up-fill" variant="primary"
                    v-if="item.audio"
                    v-b-tooltip.hover title="Tắt âm thanh."
                  >
                  </b-icon>
                  <b-icon
                    icon="volume-mute-fill" variant="normal"
                    v-else
                    v-b-tooltip.hover title="Bật âm thanh."
                  >
                  </b-icon>
                </b-button>
              </b-row>
            </b-col>
            <b-col cols="1">
              <b-row>
                <b-button variant="light" @click="onDeleteChannel(index)">
                  <b-icon icon="trash-fill" variant="danger"
                    v-b-tooltip.hover title="Xóa channel"
                  >
                  </b-icon>
                </b-button>
              </b-row>
            </b-col>
            <b-col cols="1">
              <b-row>
                <b-button variant="light" @click="onCopyWebrtcUrl(item)">
                  <b-icon icon="back" variant="success"
                    v-b-tooltip.hover title="Sao chép WebrtcUrl"
                  >
                  </b-icon>
                </b-button>
              </b-row>
            </b-col>
          </b-row>
        </b-row><br>
        <b-button variant="success" @click="addChannel()" v-if="form.channels && form.channels.length < 5">
          <b-icon-plus-circle/>
        </b-button>
      </div>
    </modal>
    <modal name="deleteStream" 
      draggable=".deleteStream"
      width="300px"
      height="200px"
      >
      <div style="font-size: 20px;font-weight: bold; position: absolte; background-color: gray; color: white; padding: 5px;">
        Xác nhận xóa luồng stream
      </div>
      <div style="display: flex; flex-direction: row; justify-content: center;
        align-items: center;
        padding-top: 20px;
        height: 60px;
      ">
        <b-icon icon="trash-fill" variant="danger"
          v-b-tooltip.hover title="Xóa stream"
          style="width: 40px; height: 40px;"
        >
        </b-icon>
      </div>
      <p>
        Xác nhận xóa Stream: {{ streamDelete.name }}
      </p>
      <hr>
      <div style="display: flex; flex-direction: row; justify-content: flex-end;
        align-items: center; margin: 10px;
      ">
        <b-button
          style="margin-right: 10px;"
          variant="danger" size="sm" @click="cancelDeleteStream">
          Hủy
        </b-button>
        <b-button
          variant="success" size="sm" @click="confirmDeleteStream">Xác nhận
        </b-button>
      </div>
    </modal>
  </b-container>
</template>

<script>
import axios from 'axios';
import Player from './WebRTCPlayer';
import HLSLLPlayer from './HLSLLPlayer';
import HLSPlayer from './HLSPlayer';
import MSEPlayer from './MSEPlayer';
import APP_CONFIG from '../config.js'
import { $ } from '../common.js';

export default {
  name: 'HelloWorld',
  components: {
    Player,
    HLSLLPlayer,
    HLSPlayer,
    MSEPlayer
  },
  props: {
    // msg: String
  },
  data() {
    return {
      formatList: ['webrtc', 'hls', 'hlsll', 'mse'],
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
      form: {},
      streamDelete: {},
      searchText: '',
      searchTextManage: '',
      isSearching: false,
      totalResultSearch: 0,
      listStreamManageDisplay: []
    }
  },
  mounted: function() {
    this.$nextTick(async function() {
      await this.getListCamWebRTC();
    });
  },
  watch: {
    searchTextManage() {
      if (this.searchTextManage.length === 0) {
        this.listStreamManageDisplay = this.streamList;
      }
    },
    searchText() {
      if (this.searchText.length === 0) {
        this.isSearching = false;
        let resultDisplay = [];
        if (this.streamList.length > 0) {
          this.totalPage = Math.ceil(this.streamList.length / this.perPage);
          // console.log('SO TRANG:',this.totalPage);
          // console.log('TRANG HIEN TAI', this.currentPage);
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
        this.currentPage = 1;
      } else {
        this.isSearching = true;
      }
    },
    currentPage() {
      let resultDisplay = [];
      if (this.isSearching) {
        //Paginate
        const listStreamFiltered = this.streamList.filter((item) => {
          return item.name.toLowerCase().includes(String(this.searchText).toLowerCase());
        })
        console.log(listStreamFiltered);
        let resultDisplay = [];
        if (listStreamFiltered.length > 0) {
          this.totalPage = Math.ceil(listStreamFiltered.length / this.perPage);
          if (this.currentPage < this.totalPage) {
            let start = (this.currentPage - 1) * this.perPage;
            let end = this.currentPage * this.perPage;
            resultDisplay = listStreamFiltered.slice(start, end);
          } else {
            let start = (this.currentPage - 1) * this.perPage;
            let end = listStreamFiltered.length;
            resultDisplay = listStreamFiltered.slice(start, end);
          }
        }
        this.streamListDisplay = resultDisplay;
      } else {
        if (this.streamList.length > 0) {
          this.totalPage = Math.ceil(this.streamList.length / this.perPage);
          // console.log('SO TRANG:',this.totalPage);
          // console.log('TRANG HIEN TAI', this.currentPage);
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
      }
      
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
    changeModePlay(index, classEl) {
      const videoHeaderEl = $(classEl);
      // console.log(videoHeaderEl);
      const menuItem = videoHeaderEl.getElementsByClassName('menuPlayMode');
      if (menuItem[0].style.display === 'none') {
        menuItem[0].style.display = 'block';
      } else {
        menuItem[0].style.display = 'none';
      }
    },
    showModeList(value) {
      const videoHeaderEl = $(value);
      // console.log(videoHeaderEl);
      const menuItem = videoHeaderEl.getElementsByClassName('menuPlayMode');
      if (menuItem[0].style.display === 'none') {
        menuItem[0].style.display = 'block';
      } else {
        menuItem[0].style.display = 'none';
      }
    },
    formatter(value) {
      return value.toLowerCase().trim().replace(' ', '_');
    },
    searchStream(text) {
      console.log(text);
      if (this.isSearching) {
        //Paginate
        const listStreamFiltered = this.streamList.filter((item) => {
          return item.name.toLowerCase().includes(String(text).toLowerCase());
        })
        this.totalResultSearch = listStreamFiltered.length;
        let resultDisplay = [];
        if (listStreamFiltered.length > 0) {
          this.totalPage = Math.ceil(listStreamFiltered.length / this.perPage);
          if (this.currentPage < this.totalPage) {
            let start = (this.currentPage - 1) * this.perPage;
            let end = this.currentPage * this.perPage;
            resultDisplay = listStreamFiltered.slice(start, end);
          } else {
            let start = (this.currentPage - 1) * this.perPage;
            let end = listStreamFiltered.length;
            resultDisplay = listStreamFiltered.slice(start, end);
          }
        }
        this.streamListDisplay = resultDisplay;
        this.currentPage = 1;
      }
    },
    searchStreamManage(text) {
      this.listStreamManageDisplay = this.streamList.filter(item => {
        return item.name.toLowerCase().includes(String(text).toLowerCase());
      });
    },
    onChangeDebug(indexChannel) {
      this.form.channels[indexChannel].debug = !this.form.channels[indexChannel].debug;
      this.$toast.info(`Đã ${this.form.channels[indexChannel].debug ? 'bật' : 'tắt'} chức năng Debug cho channel`);
    },
    onChangeOnDemand(indexChannel) {
      this.form.channels[indexChannel].on_demand = !this.form.channels[indexChannel].on_demand;
      this.$toast.info(`Đã ${this.form.channels[indexChannel].on_demand ? 'bật' : 'tắt'} chức năng OnDemand cho channel`);
    },
    onChangeAudio(indexChannel) {
      this.form.channels[indexChannel].audio = !this.form.channels[indexChannel].audio;
      this.$toast.info(`Đã ${this.form.channels[indexChannel].audio ? 'bật' : 'tắt'} âm thanh cho channel`);
    },
    onDeleteChannel(indexChannel) {
      this.form.channels.splice(indexChannel, 1);
    },
    onCopyWebrtcUrl(channel) {
      // console.log(channel.webrtcUrl);
      const webrtcTemp = APP_CONFIG.BASE_URL + channel.webrtcUrl;
      navigator.clipboard.writeText(webrtcTemp);
      this.$toast.info(`Đã sao chép thành công`);

    },
    add(data) {
      // console.log(data);
      const payload = {};
      payload.name = data.name.replace(' ', '_');
      payload.channels = {};
      if (data.channels.length) {
        for (const channel of data.channels) {
          payload.channels[channel.name] = channel
        }
      }
      // console.log(payload);
      try {
        axios.post(APP_CONFIG.BASE_URL + APP_CONFIG.API_ENPOINT.ADD_STREAM + '/' + payload.name + '/add',payload,{
          auth: {
            username: APP_CONFIG.BASIC_AUTH.USERNAME,
            password: APP_CONFIG.BASIC_AUTH.PASSWORD
          }
        }).then(res => {
          this.$modal.hide('streamModal');
          if (res.data.status) {
            this.$toast.success('Thêm stream mới thành công');
            this.getListCamWebRTC();
          } else {
            this.$toast.success('Thêm stream mới thất bại');
          }
        })
      } catch (error) {
        this.$toast.success('Thêm stream mới thất bại');
        throw new Error(error.message)
      }
    },
    update(data) {
      // console.log(data);
      const payload = {};
      payload.name = data.name;
      payload.channels = {};
      if (data.channels.length) {
        for (const channel of data.channels) {
          payload.channels[channel.name] = channel
        }
      }
      try {
        axios.post(APP_CONFIG.BASE_URL + APP_CONFIG.API_ENPOINT.ADD_STREAM + '/' + data.name + '/edit',payload,{
          auth: {
            username: APP_CONFIG.BASIC_AUTH.USERNAME,
            password: APP_CONFIG.BASIC_AUTH.PASSWORD
          }
        }).then(res => {
          this.$modal.hide('streamModal');
          if (res.data.status) {
            this.$toast.success('Chỉnh sửa thành công');
            // console.log(payload);
            this.getListCamWebRTC();
          } else {
            this.$toast.success('Chỉnh sửa thất bại');
          }
        })
      } catch (error) {
        this.$toast.success('Chỉnh sửa thất bại');
        throw new Error(error.message)
      }
    },
    addChannel() {
      this.form.channels.push({
        name: '',
        url: '',
        on_demand: true,
        debug: false,
        audio: false,
        status: 0
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
          on_demand: true,
          debug: false,
          audio: false,
          status: 0
        }]
      }
    },
    cancelDeleteStream() {
      this.streamDelete = {};
      this.$modal.hide('deleteStream');
    },
    async confirmDeleteStream() {
      try {
        await axios.get(APP_CONFIG.BASE_URL + APP_CONFIG.API_ENPOINT.ADD_STREAM + '/' + this.streamDelete.name + '/delete',{
          auth: {
            username: APP_CONFIG.BASIC_AUTH.USERNAME,
            password: APP_CONFIG.BASIC_AUTH.PASSWORD
          }
        }).then(res => {
          if (res.data.status) {
            this.$toast.success(`Xóa thành công stream ${this.streamDelete.name}!`);
            this.getListCamWebRTC();
            this.$modal.hide('deleteStream');
          }
        })
      } catch (error) {
        this.$toast.error(`Có lỗi xảy ra khi xóa luồng stream ${this.streamDelete.name}!`);
        throw new Error(error);
      }
    },
    deleteStream(item) {
      // console.log(item, index);
      this.streamDelete = item;
      this.$modal.show('deleteStream');
    },
    editStream(stream) {
      this.action = 'edit';
      this.form = stream;
      this.$modal.show('streamModal');
    },
    showStreamConfig(id) {
      // console.log(id);
      // console.log(this.showStreamList);
      this.showStreamList[id] = true;
      // console.log(this.showStreamList);
    },
    getIDStream(val) {
      return '#' + String(val);
    },
    openManageModal() {
      this.$modal.show('manageModal');
      this.listStreamManageDisplay = this.streamList;
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
        // console.log(event.streams.length + ' track is delivered');
        let videoEl = document.querySelector('#webrtc-video-modal');
        videoEl.srcObject = event.streams[0];
        videoEl.play();
      }
      this.webrtc.addTransceiver('video', {
      'direction': 'sendrecv'
      });
      // this.webrtcSendChannel = this.webrtc.createDataChannel('sendchannel');
      // this.webrtcSendChannel.onopen = () => {
      //   console.log('sendChannel has opened');
      //   // this.webrtcSendChannel.send('ping');
      //   // this.webrtcSendChannelInterval = setInterval(() => {
      //   //     this.webrtcSendChannel.send('ping');
      //   // }, 1000)
      // }
      // this.webrtcSendChannel.onmessage = e => console.log(e.data);
    },
    async handleNegotiationNeeded() {
      let url = APP_CONFIG.BASE_URL + this.currentUrl;
      // console.log(url);
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
      this.loadingPreview = true;
      this.currentUrl = selectChannel.url;
      await this.startPlay();
      this.$modal.show('previewModal');
    },
    async getListCamWebRTC() {
      this.isRebooting = true;
      try {
        axios.get(APP_CONFIG.BASE_URL + APP_CONFIG.API_ENPOINT.STREAMS,{
          auth: {
            username: APP_CONFIG.BASIC_AUTH.USERNAME,
            password: APP_CONFIG.BASIC_AUTH.PASSWORD
          }
        }).then(res => {
          this.isRebooting = false;
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
                    webrtcUrl: '/stream/' + stream + '/channel/' + channel + '/webrtc?uuid=' + stream + '&channel=' + channel,
                    hlsUrl: '/stream/' + stream + '/channel/' + channel + '/hls/live/index.m3u8',
                    hlsllUrl: '/stream/' + stream + '/channel/' + channel + '/hlsll/live/index.m3u8',
                    mseUrl: '/stream/' + stream + '/channel/' + channel + '/mse?uuid=' + stream + '&channel=' + channel,
                    url: res.data.payload[stream].channels[channel].url,
                    on_demand: res.data.payload[stream].channels[channel]?.on_demand || false,
                    debug: res.data.payload[stream].channels[channel]?.debug || false,
                    audio: res.data.payload[stream].channels[channel]?.audio ||false,
                    status: res.data.payload[stream].channels[channel]?.status ||0
                  })
                }
              }
              tmp.push({
                name: stream,
                channels: channels,
                playType: 'webrtc'
              })
            }
          }
          //Total stream
          this.streamList = tmp.reverse();
          console.log('[TOTAL STREAMS]:', this.streamList);
          //Paginate
          let resultDisplay = [];
          if (this.streamList.length > 0) {
            this.totalPage = Math.ceil(this.streamList.length / this.perPage);
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
      } catch (error) {
        this.$toast.error('Có lỗi xảy ra khi lấy danh sách luồng stream!');
        throw new Error(error);
      }
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
.searchManage {
  border-radius: 5px;
  padding: 10px;
  padding-left: 20px;
  padding-right: 20px;
}
.menuPlayMode {
  position: absolute;
  background-color: white;
  box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
  padding: 5px 10px;
  border: 1px solid gray;
  border-radius: 8px;
  display: none;
}
.buttonMedia {
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  border-radius: 50%;
  background-color: white;
  border: 1px solid gray;
  box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
}
</style>
