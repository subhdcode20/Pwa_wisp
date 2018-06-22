import React, { Component } from "react";
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { Twemoji } from "react-emoji-render";
import Timestamp from "react-timestamp";
import Avatar from "material-ui/Avatar";
import TextField from "material-ui/TextField";
import Dialog from 'material-ui/Dialog';
import RaisedButton from 'material-ui/RaisedButton';
import ActionSend from "material-ui/svg-icons/content/send";
import ActionSeen from "material-ui/svg-icons/action/done-all";
import ActionUnSeen from "material-ui/svg-icons/navigation/check";
import RefreshIndicator from "material-ui/RefreshIndicator";
import { cyan500 } from "material-ui/styles/colors";
import { getLastMsg, sendPush, addChildListener, setChats, addChats, setItems, unfriend, setUnreadChatCount } from '../../actions/friends';
import { htmlDecode, formatTime, formatDate } from '../../utility';

import Header from "../Header";

import Styles from "./style.scss";

class Chat extends Component {
	constructor(props) {
		super(props);
		this.state = {
			message: "",
			chats: [],
			loading: true,
			isOtherOnline: false,
			friendsLastSeen: '',
			sentTime: Date.now(),
			isUnfriend: false
		};
		this.handleMsg = this.handleMsg.bind(this);
		this.sendPlz = this.sendPlz.bind(this);
		this.startListening = this.startListening.bind(this);
		this.handleChildAdd = this.handleChildAdd.bind(this);
		this.headerValue = this.headerValue.bind(this);
		this.processChat = this.processChat.bind(this);
		this.updateOnlineStatus = this.updateOnlineStatus.bind(this);
	}

	componentWillMount() {
		console.log("in willMount Chat");
		localStorage.setItem("CHAT_BOX_CLOSED", false)
		if(!this.props.data) return false;
		const { data, fromId } = this.props;
		localStorage.setItem(`NG_PWA_UNREAD_COUNT_${data.meetingId}`, 0)
		this.props.setUnreadChatCount(this.props.data.meetingId, 0);
		this.props.setChats(data.meetingId);

		window.onresize = () => {
			this.scrollUp();
		}

		//check if other participant is online
		firebase.database()
		.ref(`/isOnline/${data.channelId}`)
		.once("value", snapshot => {
			const isOnline = snapshot.val();
			if( isOnline && isOnline.online) this.props.setItems('isOtherOnline', data.channelId, isOnline.online);
		});

		firebase.database()
		.ref(`/isOnline/${fromId}`)
		.once("value", snapshot => {
			const isOnline = snapshot.val();
			console.log("SELF ONLINE status-- ", isOnline)

		});

		// get lastSeen of friend
		firebase.database()
		.ref(`/lastSeen/${data.channelId}`)
		.once("value", snapshot => {
			const lastSeen = snapshot.val();
			if( lastSeen && lastSeen.seenTime ) this.props.setItems('friendsLastSeen', data.channelId, lastSeen.seenTime);
		});

		// if user is offline, get last seen of friend from cache
		if(!navigator.onLine) {
			try{
				const lastSeens = JSON.parse(localStorage.getItem('NG_PWA_FRIEND_LAST_SEEN'));
				if(lastSeens[data.channelId]) this.props.setItems('friendsLastSeen', data.channelId, lastSeens[data.channelId]);
			} catch(e){}
		}


	}

	updateOnlineStatus() {
		let {data} = this.props
		console.log("in updateOnlineStatus");
		if(navigator.onLine) {
		console.log("navigator online");
			try{
				let offlineChats = localStorage.getItem(`NG_PWA_OFFLINE_CHATS`);
				console.log("offlineChats =", offlineChats, data);
				if(offlineChats) {
					offlineChats = JSON.parse(offlineChats);
					const myOfflineChats = offlineChats[data.meetingId] || [];
					if(myOfflineChats.length > 0){
						console.log("got OFFLINE CHATS");
						myOfflineChats.forEach(chatObj => {
							console.log("myOfflineChats = ", chatObj);
							this.processChat(chatObj)
						})
						delete(offlineChats[data.meetingId]);
						localStorage.setItem(`NG_PWA_OFFLINE_CHATS`, JSON.stringify(offlineChats));
					}
				}
			}catch(e){}
		}
	}

	componentWillReceiveProps(nextProps){
		console.log("Chat receive props= ", nextProps);
		const { data, chats, childListeners, fromId } = nextProps;
		const myChats = chats[data.meetingId];
		this.setState({ chats: myChats });
		console.log("in condition= ", myChats, !childListeners.includes(data.meetingId));
		if (!childListeners.includes(data.meetingId)) {
			console.log("childListeners includes - ");
			let lastChat;
			if (myChats && myChats.length > 0) {
				lastChat = myChats[myChats.length - 1];
			}
			console.log("call startListening -- ", lastChat);
            this.startListening(lastChat);
    } else {
			console.log("else - ");
            this.setState({ loading: false });
		}
	}

	componentDidMount() {
		console.log("componentDidMount ++");
		if(document.getElementById('loading')) document.getElementById('loading').remove();
		if(document.getElementById('fullscreen')) document.getElementById('fullscreen').remove();
		if(navigator.onLine) {
			const { data } = this.props;
			try{
				let offlineChats = localStorage.getItem(`NG_PWA_OFFLINE_CHATS`);
				if(offlineChats) {
					offlineChats = JSON.parse(offlineChats);
					const myOfflineChats = offlineChats[data.meetingId] || [];
					if(myOfflineChats.length > 0){
						myOfflineChats.forEach(chatObj => {
							console.log("myOfflineChats = ", chatObj);
							this.processChat(chatObj)
						})
						delete(offlineChats[data.meetingId]);
						localStorage.setItem(`NG_PWA_OFFLINE_CHATS`, JSON.stringify(offlineChats));
					}
				}
			}catch(e){}
		}
		this.scrollUp();

		window.addEventListener('online',  this.updateOnlineStatus);
	}

	componentWillUpdate() {
		console.log("componentWillUpdate ++");
	}

	componentDidUpdate() {
		console.log("componentDidUpdate ++");
		this.scrollUp();
	}

	componentWillUnmount() {
		window.onresize = {};
	}

	scrollUp() {
		try{
			const chatbox = document.getElementById('chatBox');
			chatbox.scrollTop = chatbox.scrollHeight;
			chatbox.scrollTo(0, chatbox.scrollHeight);
		}catch(e){}
	}

	handleMsg(prop, message) {
		this.setState({
			message
		});
	}

	sendPlz() {
		console.log("in sendPlz");
		const { data, fromId, isOtherOnline } = this.props;
		if (this.state.message.trim() === "") return false;
		this.setState({
			message: ""
		});
		const chatObj = {
			fromId,
			msg: this.state.message,
			sentTime: Date.now(),
			toId: data.channelId
		};
		this.setChat(chatObj);
		if(navigator.onLine){
			this.processChat(chatObj);
		}else {
			this.cacheSentChat(chatObj);
		}
	}

	cacheSentChat(chatObj) {
		console.log("in cacheSentChat ", chatObj);
		const { data, fromId, isOtherOnline } = this.props;
		let offlineChats = localStorage.getItem(`NG_PWA_OFFLINE_CHATS`);
		let myOfflineChats = [];
		if(offlineChats) {
			offlineChats = JSON.parse(offlineChats);
			myOfflineChats = offlineChats[data.meetingId] || [];
		} else {
			offlineChats = {};
		}
		myOfflineChats.push(chatObj);
		offlineChats[data.meetingId] = myOfflineChats;
		localStorage.setItem(`NG_PWA_OFFLINE_CHATS`, JSON.stringify(offlineChats));

		// send offline chats once offline
		window.addEventListener('online',  this.sendOffliceMessages);
	}

	processChat(chatObj) {
		console.log("in processChat ", chatObj);
		const { data, fromId, isOtherOnline } = this.props;
		firebase
			.database()
			.ref(`/rooms/${data.meetingId}`)
			.push(chatObj).then(res => {
				chatObj.id = res.key;
				if (chatObj.id) {
					this.storeChat(chatObj);
				}
				console.log('getLastMsg in processChat= ', data.meetingId, chatObj);
				this.props.getLastMsg(data.meetingId, chatObj)
			});
		try {
			this.refs["autoFocus"].select();
		} catch (e) {}

		if (navigator.onLine ) { //&& !(isOtherOnline && isOtherOnline[data.channelId])
			console.log("sendPush= ", {
				toChannelId: data.channelId,
				fromChannelId: fromId,
				msg: chatObj.msg.substring(0,200)  //this.state.message.substring(0,200)
			});
			this.props.sendPush({
				toChannelId: data.channelId,
				fromChannelId: fromId,
				msg: chatObj.msg.substring(0,200)  //this.state.message.substring(0,200)
			});
		}
	}

	startListening(lastChat) {
		console.log('in startListening -- ', lastChat);
		const {data, fromId} = this.props;

		//intercepts for any new message from firebase with check of lastchatId
		if (lastChat && lastChat.id) {
			firebase
				.database()
				.ref(`/rooms/${data.meetingId}`)
				.orderByKey()
				.startAt(lastChat.id)
				.on('child_added', snapshot => this.handleChildAdd(snapshot, lastChat));

		} else {
			firebase
				.database()
				.ref(`/rooms/${data.meetingId}`)
				.on('child_added', snapshot => this.handleChildAdd(snapshot));
		}

		firebase.database()
		.ref(`/isOnline/${data.channelId}`)
		.on("child_changed", snapshot => {
			const isOtherOnline = snapshot.val();
			if(isOtherOnline!==null && typeof isOtherOnline !== 'undefined') this.props.setItems('isOtherOnline', data.channelId, isOtherOnline);
		});

		firebase.database()
		.ref(`/lastSeen/${data.channelId}`)
		.on("child_changed", snapshot => {
			const friendsLastSeen = snapshot.val();
			if(friendsLastSeen) this.props.setItems('friendsLastSeen', data.channelId, friendsLastSeen);
		});

		this.props.addChildListener(data.meetingId);
	}

	handleChildAdd(snapshot, lastChat) {
		console.log('handleChildAdd = ', snapshot, lastChat, this.props.fromId);
		const msg = snapshot.val();
		const msgId = snapshot.key;
		console.log('msg in handleChildAdd= ', msg);
		msg.id = msgId;
		if (
			(lastChat && lastChat.id && lastChat.id === msgId) ||
			(msg.fromId === this.props.fromId &&
			parseInt(msg.sentTime, 10) > this.state.sentTime)
		) {
			return true;
		} else {
			console.log("set and store chat on handleChildAdd");
			this.setChat(msg);
			this.storeChat(msg);
		}
	}

	setChat(msg) {
		this.props.addChats(this.props.data.meetingId, msg)
	}

	storeChat(msg) {
		try {
			const { data } = this.props;
			const chats = JSON.parse(localStorage.getItem(`NG_PWA_CHAT_${data.meetingId}`)) || [];
			chats.push(msg);
			localStorage.setItem(
				`NG_PWA_CHAT_${this.props.data.meetingId}`,
				JSON.stringify(chats)
			);
		}catch(e){}
	}

	headerValue(name) {
		const { data, isOtherOnline, friendsLastSeen  } = this.props;
		const localfriendsLastSeen = JSON.parse(localStorage.getItem("NG_PWA_FRIEND_LAST_SEEN"))
		console.log("headerValue = ", friendsLastSeen, localfriendsLastSeen, data.channelId);

		let subHead = '';
		if(navigator.onLine) {
			if (isOtherOnline && isOtherOnline[data.channelId])
			subHead = <span>Online</span>;
			else if(friendsLastSeen && friendsLastSeen[data.channelId]){
				const lastSeenObj = new Date(friendsLastSeen[data.channelId]);
				console.log('friendsLastSeen data ok show header= ', lastSeenObj);
				subHead = <span>Last seen {<Timestamp time={lastSeenObj} />}</span>;
			}
			else subHead = 'Not yet on NG lite';
		}
		return <div className={Styles.chatHeader}>
			<span>{htmlDecode(name)}</span>
			<span>{subHead}</span>
		</div>
	}

	unfriendActionButtons() {
		return [
			<RaisedButton
				label="No"
				primary={false}
				onClick={this.toggleUnfriendDialog.bind(this, true)}
				disabled={this.props.isLoading}
			/>,
			<span>&nbsp;&nbsp;</span>,
			<RaisedButton
				label="Yes"
				primary={true}
				keyboardFocused={true}
				onClick={this.unfriendAction.bind(this)}
				disabled={this.props.isLoading}
			/>
		]
	}

	toggleUnfriendDialog(isOpen) {
		const isUnfriend = isOpen || false
		this.setState({ isUnfriend: !isUnfriend });
	}

	unfriendAction() {
		const { data, fromId } = this.props;
		this.props.unfriend(data.channelId, fromId);
	}

	render() {
		const { data, fromId, isOtherOnline, friendsLastSeen } = this.props;
		let navOnline = navigator.online
		if(!data){
			return <Redirect to="/" push />
		}
		const AvtarUrl = `https://s3-us-west-2.amazonaws.com/wisp-image/ng/thumb/50_50_profile_${data.imageUrl}`   //`https://img.neargroup.me/project/50x50/forcesize/50x50/profile_${data.imageUrl}`;
		const uccChat = localStorage.getItem("NG_PWA_UNREAD_COUNTS")

		let lastTriggerStamp = localStorage.getItem(`CHAT_LAST_TRIGGERSTAMP_${data.meetingId}`)
		console.log('lastTriggerStamp in render= ', lastTriggerStamp);
		// let newTriggerStamp = triggerStamp
		console.log("actionsend= ", navOnline, isOtherOnline, isOtherOnline[data.channelId], navOnline && isOtherOnline && isOtherOnline[data.channelId], isOtherOnline && isOtherOnline[data.channelId])
		console.log("also= ", navOnline && (isOtherOnline && isOtherOnline[data.channelId]));

		return (
		<div className={Styles.chatWindow}>
			<Header
				name={this.headerValue(data.name)}
				avtar={AvtarUrl}
				action='home'
				unfriend={this.toggleUnfriendDialog.bind(this)}
				style={{backgroundColor: '#AA00FF'}}
			/>
			{
				this.state.loading &&
				navigator.onLine &&
				<RefreshIndicator
					size={40}
					left={10}
					top={0}
					status="loading"
					className={Styles.refresh}
				/>
			}
			<div className={Styles.ChatBox} id="chatBox">
				{this.state.chats.map((chat, index) => {
					let newDay = "";
					let showUnreadMessage = false
					if (index === 0) {
						newDay = formatDate(chat.sentTime);
					} else {
						const newDate = formatDate(chat.sentTime);
						const oldDate = formatDate(
							this.state.chats[index - 1].sentTime
						);
						if (newDate !== oldDate) {
							newDay = newDate;
						}
					}
					const chatTime = chat.sentTime?new Date(parseInt(chat.sentTime,10)):null;
					// console.log("showUnreadMessage condition= ", index, Number(chat.sentTime), Number(lastTriggerStamp));
					// if(index > 0) {
					// 	console.log(" -- ", Number(this.state.chats[index-1].sentTime));
					// }
					console.log("msg= ", encodeURIComponent(chat.msg), decodeURIComponent(chat.msg));
					if(index > 0
						&& Number(chat.sentTime) > Number(lastTriggerStamp)
						&& Number(this.state.chats[index-1].sentTime) < Number(lastTriggerStamp)
						&& chat.fromId != this.props.fromId
					) {
						showUnreadMessage = true
					}
					// if(Number(Number(index) + Number(uccChat[data.meetingId])) == Number(this.state.chats.length)) {
					// 	showUnreadMessage = true
					// }
					// console.log("showUnreadMessage= ", showUnreadMessage, index, uccChat, data.meetingId, this.state.chats.length);
					// console.log("=== ", index, uccChat[data.meetingId.toString()], (index) + uccChat[data.meetingId.toString()], this.state.chats);
					return(
					<div key={index} className={chat.fromId == fromId ? Styles.self : ""}>
						{newDay &&
							<div className={Styles.newDay}>
								{newDay}
							</div>
						}
						{showUnreadMessage &&
							<div className={Styles.newDay}>
								<Twemoji text={htmlDecode("Unread Messages")} />
							</div>
						}
						<span className={Styles.chatlet}>
							<Twemoji text={htmlDecode(chat.msg)} />
						</span>
						<span className={Styles.time}>
							{
								chatTime &&
								<Timestamp time={chatTime} format='time'/>
							}
							{
								chat.fromId == fromId &&
								<span className={Styles.isSeen}>
									{
										(isOtherOnline && isOtherOnline[data.channelId]) ||
										(friendsLastSeen && (chat.sentTime <= friendsLastSeen[data.channelId]))
										? <ActionSeen color={cyan500}/>
										: <ActionUnSeen/>
									}
								</span>
							}
						</span>
					</div>);
				})}
			</div>
			<div className={Styles.actionBtns}>
				<TextField
					onChange={this.handleMsg}
					value={this.state.message}
					fullWidth={true}
					hintText="Type a message..."
					multiLine={true}
					underlineStyle={{display: 'none'}}
					onKeyPress={ev => {
						if (ev.key === "Enter" && ev.shiftKey) {
							this.sendPlz();
							ev.preventDefault();
						}
					}}
					ref="autoFocus"
				/>
				<a onClick={this.sendPlz}>
					<ActionSend color={cyan500} />
				</a>
			</div>
			<Dialog
				title="Unfriend"
				actions={this.unfriendActionButtons()}
				modal={false}
				open={this.state.isUnfriend}
				className={Styles.unfriendDialog}
				>
				<div className={Styles.dialogbody}>{`Are you sure you want to unfriend ${data.name}?`}</div>
			</Dialog>
		</div>
		);
	}
}

const mapStateToProps = state => {
	return {
		fromId: (state.friends.me && state.friends.me.channelId) || '',
		data: state.friends.meetingData || null,
		childListeners: state.friends.childListeners || [],
		chats: state.friends.chats || {},
		triggerStamp: state.friends.triggerStamp || Date.now(),
		isOtherOnline: state.friends.isOtherOnline || {},
		friendsLastSeen: state.friends.friendsLastSeen || {},
		isLoading: state.friends.isLoading || false
	  }
}

const mapDispatchToProps = dispatch => {
	return {
		getLastMsg: (id, msg) => {
			dispatch(getLastMsg(id, msg));
		},
		sendPush: data => {
            dispatch(sendPush(data));
		},
		addChildListener: meetingId => {
			dispatch(addChildListener(meetingId));
		},
		setChats: meetingId => {
			dispatch(setChats(meetingId));
		},
		addChats: (meetingId, msg) => {
			dispatch(addChats(meetingId, msg));
		},
		setItems: (item, id, value) => {
			dispatch(setItems(item, id, value));
		},
		unfriend: (me, notFriend) => {
			dispatch(unfriend(me, notFriend));
		},
		setUnreadChatCount: (id, count) => {
			dispatch(setUnreadChatCount(id, count));
		},
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(Chat);
