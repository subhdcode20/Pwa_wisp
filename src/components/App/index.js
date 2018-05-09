import React, { Component } from 'react';
import { connect } from 'react-redux';
import FriendList from '../FriendList';
import Chat from '../Chat';
import { getFriends, getFriendsCache, getLastMsg, getFriendsChat } from '../../actions/friends';
import initialize from "../../initializeFirebase";
import setFCM from '../../FCM';

import Styles from './style.scss';

let lastTouchY = 0;
let maybePreventPullToRefresh = false;

class List extends Component {

    constructor(props) {
        super(props);
        this.state = {
            error: false,
            firstCall: true
        };
        this.touchstartHandler = this.touchstartHandler.bind(this);
        this.stopTouchReload = this.stopTouchReload.bind(this);
        this.processNotifications = this.processNotifications.bind(this);
    }

    componentWillMount() {
      console.log('localstorage in app index will mount', localStorage);
        this.props.getFriendsCache();
        document.addEventListener('touchstart', this.touchstartHandler, false);
        document.addEventListener('touchmove', this.stopTouchReload, false);
        this.setState({
            isNotificationEnabeled: localStorage.getItem(`NG_PWA_NOTIFICATION`)
        });
        const lastMessages = localStorage.getItem('NG_PWA_LAST_MSG');
        try {
            this.setState({
                lastMsg: JSON.parse(lastMessages)
            })
        }catch(e){}
    }

    touchstartHandler(e) {
        try{
            if (e.touches.length != 1) return;
            lastTouchY = e.touches[0].clientY;
            maybePreventPullToRefresh = window.pageYOffset == 0;
        }catch(e){}
    }

    stopTouchReload(e) {
        try{
            const touchY = e.touches[0].clientY;
            var touchYDelta = touchY - lastTouchY;
            lastTouchY = touchY;
            if (maybePreventPullToRefresh) {
                maybePreventPullToRefresh = false;
                if (touchYDelta > 0) {
                    e.preventDefault();
                    return;
                }
            }
        }catch(e){}
      }

    componentDidMount() {
      console.log('localStorage, props in app index didMount = ', localStorage, this.props);
        if(navigator.onLine ){ //&& !this.props.noReload
            let authId;
            const searchText = this.props.route.location.search;
            if(searchText && searchText.trim != ""){
                const searchParams = searchText.split('=');
                if(searchParams.length > 2) this.setState({ error: true });
                authId = searchParams.pop();
                console.log('GOT authId= ', authId);
                localStorage.setItem('NG_PWA_AUTHID', JSON.stringify(authId));
            } else {
                try{
                    authId = JSON.parse(localStorage.getItem('NG_PWA_AUTHID'));
                }catch(e){}
            }
            this.props.getFriends(authId);
        }
    }

    componentWillReceiveProps(props) {
      console.log('props in App index WillReceiveProps=', props, (
          navigator.onLine &&
          props.friends &&
          props.friends.length != 0 &&
          this.state.firstCall &&
          !this.props.noReload
      ));
        if(
            navigator.onLine &&
            props.friends &&
            props.friends.length != 0 &&
            this.state.firstCall &&
            !this.props.noReload
        ) {
            const friendMeetingIds = [];
            this.setState({ firstCall: false });
            props.friends.forEach(friend => {
                friendMeetingIds.push(friend.meetingId);
                console.log('getting firebase room with meetingId ' + friend.meetingId + ' = ');
                firebase.database().ref(`/rooms/${friend.meetingId}`)
                .limitToLast(1)
                .on('value', snap => {
                    const value = snap.val();

                    console.log("firebase room result= ", value);

                    if (value) {
                        const msg = value[Object.keys(value)[0]];
                        this.props.getLastMsg(friend.meetingId, msg);
                    }

                });
            });
            this.setFriendsChat(props.me.channelId, friendMeetingIds);
        }
    }

    setFriendsChat(channelId, friendMeetingIds) {
      console.log('app index setFriendsChat channelId and friendMeetingIds = ', channelId , friendMeetingIds);
        try{
            const botChats = JSON.parse(localStorage.getItem('NG_PWA_BOT_CHATS')) || {};
            console.log('botChats= ', botChats);
            const storedFriends = Object.keys(botChats);
            //filter botchats from meetingIds
            const newFriends = friendMeetingIds.filter(id => !storedFriends.includes(id));
            console.log('newFriends= ', newFriends);

            // Commented only for testing..Uncomment for production
            // if(newFriends.length !== 0) this.props.getFriendsChat(channelId, newFriends);
        }catch(e){}
    }
    processNotifications() {
        if (!navigator.onLine) return false;
        this.setState({
            isNotificationEnabeled: true
        });
        localStorage.setItem(`NG_PWA_NOTIFICATION`, true);
        localStorage.setItem(`NG_PWA_START`, Date.now());
        if(
            this.props.me &&
            this.props.me.channelId
        ) {
            setFCM(this.props.me.channelId);
        }
    }

    render() {
      console.log('app index render = ', this.props, this.state);
        const { me } = this.props;

        if(this.state.error || !me.channelId) return <div />;
        return (
            <div>
                {!this.state.isNotificationEnabeled &&
                    <div>
                        <div className={Styles.overlay} />
                        <div
                            className={Styles.popup}
                            style={{background: 'url(notify.png)'}}
                            onClick={this.processNotifications}
                        />
                    </div>
                }
                <FriendList />
            </div>
        );
    }
}

const mapStateToProps = state => {
  console.log('mapStateToProps in app index= ', state);
    return {
        me: state.friends.me || {},
        friends: state.friends.friends || [],
        noReload: state.friends.noReload || false
    }
}

const mapDispatchToProps = dispatch => {
    return {
        getFriends: authId => {
            dispatch(getFriends(authId));
        },
        getFriendsCache: () => {
            dispatch(getFriendsCache());
        },
        getFriendsChat: (channelId, newFriends) => {
            dispatch(getFriendsChat(channelId, newFriends));
        },
        getLastMsg: (id, msg) => {
            dispatch(getLastMsg(id, msg));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(List);
