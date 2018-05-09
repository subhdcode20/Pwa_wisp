import React, { Component } from "react";
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import Subheader from 'material-ui/Subheader';
import { Twemoji } from "react-emoji-render";
import Avatar from "material-ui/Avatar";
import TextField from "material-ui/TextField";
import ActionSend from "material-ui/svg-icons/content/send";
import RefreshIndicator from "material-ui/RefreshIndicator";
import { cyan500 } from "material-ui/styles/colors";
import { getLastMsg, sendPush, addChildListener, setChats, addChats } from '../../actions/friends';
import initialize from "../../initializeFirebase";
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
			sentTime: Date.now()
		};
		this.handleMsg = this.handleMsg.bind(this);
		this.sendPlz = this.sendPlz.bind(this);
		this.startListening = this.startListening.bind(this);
		this.handleChildAdd = this.handleChildAdd.bind(this);
		this.handleValue = this.handleValue.bind(this);
	}

	componentWillMount() {
		console.log('chat index willMount props = ', this.props);
		if(!this.props.data) return false;
		const { data, fromId } = this.props;
		// combine botchats and chats
		this.props.setChats(data.meetingId);

		window.onresize = () => {
			this.scrollUp();
		}
	}
	componentWillReceiveProps(nextProps){
		console.log('chat index nextProps = ', nextProps);
		const { data, chats, childListeners, fromId } = nextProps;
		const myChats = chats[data.meetingId];
		this.setState({ chats: myChats });
		if(fromId) firebase.database().ref(`/isOnline/${fromId}`).set({ online: true });
		if (!childListeners.includes(data.meetingId)) {
			let lastChat;
			if (myChats && myChats.length > 0) {
				lastChat = myChats[myChats.length - 1];
			}
            this.startListening(lastChat);
    } else {
        this.setState({ loading: false });
		}
	}

	componentDidMount() {
		if(document.getElementById('loading')) document.getElementById('loading').remove();
		this.scrollUp();
	}

	componentDidUpdate() {
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
		console.log('in sendPlz props= ', this.props);
		const { data, fromId } = this.props;
		if (this.state.message.trim() === "") return false;
		this.setState({
			message: ""
		});
		const chatObj = {
			fromId,
			toId: data.channelId,
			msg: this.state.message,
			sentTime: Date.now(),
			arrivedAt: Firebase.ServerValue.TIMESTAMP
		};
		this.setChat(chatObj);
		// add message to firebase database
		firebase
			.database()
			.ref(`/rooms/${data.meetingId}`)
			.push(chatObj).then(res => {
				console.log('firebase push chat res = ', res);
				chatObj.id = res.key;
				if (chatObj.id) {
					this.storeChat(chatObj);
				}
				this.props.getLastMsg(data.meetingId, chatObj)
			});
		try {
			this.refs["autoFocus"].select();
		} catch (e) {}

		//if chatmate is online send notification
		if (navigator.onLine) {
			this.props.sendPush({
				toChannelId: data.channelId,
				fromChannelId: fromId,
				msg: this.state.message.substring(0,200)
			});
		}
	}

	startListening(lastChat) {
		console.log('in startListening lastChat = ', lastChat);
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

		//manage self online and last seen
		if(fromId) {
			firebase.database().ref(`/isOnline/${fromId}`).onDisconnect().set({ online: false });
			firebase.database().ref(`/lastSeen/${fromId}`).onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
		}

		//check if other participant is online
		firebase.database()
		.ref(`/isOnline/${data.channelId}`)
		.on("child_changed", snapshot => {
			const isOtherOnline = snapshot.val();
			this.setState({ isOtherOnline });
		});
		//check if other participant is online
		firebase.database()
		.ref(`/isOnline/${data.channelId}`)
		.on("child_added", snapshot => {
			const isOtherOnline = snapshot.val();
			this.setState({ isOtherOnline });
		});
		this.props.addChildListener(data.meetingId);
	}

	handleChildAdd(snapshot, lastChat) {
		const msg = snapshot.val();
		console.log('handleChildAdd msg = ', msg);
		const msgId = snapshot.key;
		console.log('handleChildAdd key = ', msg);
		msg.id = msgId;
		if (
			(lastChat && lastChat.id && lastChat.id === msgId) ||
			(msg.fromId === this.props.fromId &&
			parseInt(msg.sentTime, 10) > this.state.sentTime)
		) {
			console.log('found lastChat in handleChildAdd = ', lastChat, lastChat.id);
			return true;
		} else {
			console.log('setChat and storeChat in handleChildAdd ', msg);
			this.setChat(msg);
			this.storeChat(msg);
		}
	}

	handleValue(snapshot) {
		this.setState({ loading: false });
	};

	setChat(msg) {
		console.log('in setChat msg meetingId = ',this.props.data.meetingId);
		this.props.addChats(this.props.data.meetingId, msg)
	}

	storeChat(msg) {
		console.log("storeChat in localStorage = ", msg);
		try {
			const { data } = this.props;
			const chats = JSON.parse(localStorage.getItem(`NG_PWA_CHAT_${data.meetingId}`)) || [];
			console.log('chats in localStorage = ', chats);
			chats.push(msg);
			localStorage.setItem(
				`NG_PWA_CHAT_${this.props.data.meetingId}`,
				JSON.stringify(chats)
			);
		}catch(e){}
	}

	render() {
		const { data, fromId } = this.props;
		if(!data){
			return <Redirect to="/" push />
		}
		const AvtarUrl = `https://img.neargroup.me/project/50x50/forcesize/50x50/profile_${data.imageUrl}`;
		return (
		<div className={Styles.chatWindow}>
			<Header
				name={data.name}
				avtar={AvtarUrl}
				action='home'
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
			{
				this.state.chats.length > 0 ?
					(<div className={Styles.ChatBox} id="chatBox">
						{this.state.chats.map((chat, index) => {
							let newDay = "";
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
							return(
							<div key={index} className={chat.fromId == fromId ? Styles.self : ""}>
								{newDay &&
									<div className={Styles.newDay}>
										{newDay}
									</div>
								}
								<span className={Styles.chatlet}>
									<Twemoji text={htmlDecode(chat.msg)} />
								</span>
								<span className={Styles.time}>
									{formatTime(chat.sentTime)}
								</span>
							</div>);
						})}
					</div>)
				:
					(<div className={Styles.noMessages}>
						<Subheader>No Messages found.</Subheader>
					</div>)
		}
			<div className={Styles.actionBtns}>
				<TextField
					onChange={this.handleMsg}
					value={this.state.message}
					fullWidth={true}
					hintText="Message"
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
		</div>
		);
	}
}

const mapStateToProps = state => {
	console.log('mapStateToProps in chat index= ', state);
	return {
		fromId: (state.friends.me && state.friends.me.channelId) || '',
		data: state.friends.meetingData || null,
		childListeners: state.friends.childListeners || [],
		chats: state.friends.chats || {},
		triggerStamp: state.friends.triggerStamp || Date.now()
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
		}
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(Chat);
