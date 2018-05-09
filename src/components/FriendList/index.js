import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { Twemoji } from "react-emoji-render";
import Avatar from 'material-ui/Avatar';
import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';
import RefreshIndicator from 'material-ui/RefreshIndicator';

import { setMeeting } from '../../actions/friends';

import Header from '../Header';
import NoFriends from '../NoFriends';
import Styles from './styles.scss'
import { htmlDecode, sortFriendList, formatDate, formatTime } from '../../utility';

class FriendList extends Component {

	constructor(props) {
		super(props);
		this.state = {
			loadCheck: []
		}
		this.handleImg = this.handleImg.bind(this);
		this.handleLastTime = this.handleLastTime.bind(this);
	}

	componentDidMount() {
		if(document.getElementById('loading')) document.getElementById('loading').remove();
	}
	handleImg(id, e) {
		try {
			if(!this.state.loadCheck.includes(id)) {
				this.setState(prev => {
					const loadCheck = [ ...loadCheck ];
					loadCheck.push(id);
					return { loadCheck }
				})
				e.target.src = AVTAR;
			}

		}catch(e){}
	}

	handleLastTime(t) {
		if(!t || t == '' || t == 0) return '';
		const currentTime = Date.now();
		const currentDay = formatDate(currentTime);
		const chatTime = parseInt(t);
		const chatDay = formatDate(chatTime);
		if(currentDay == chatDay) return formatTime(chatTime);
		return chatDay;
	}

	populateFriendsList() {
		const { friends, lastChats } = this.props;
		console.log('friendList index populateFriendsList friends and lastChats = ', friends, lastChats);
		// set friends last msg and time and sort for latest time
		const sortedFriends = sortFriendList(friends, lastChats) || [];
	  	const AvtarUrl = 'https://img.neargroup.me/project/forcesize/50x50/profile_';
		return sortedFriends.map( friend => {
	  		return (
	  			<ListItem
					key={friend.channelId}
					leftAvatar={<Avatar src={`${AvtarUrl}${friend.imageUrl}`} onError={this.handleImg.bind(this, friend.channelId)}/>}
					onClick={() => this.props.setMeeting(friend.meetingId)}
					primaryText={<Twemoji text={htmlDecode(friend.name)} />}
					containerElement={<Link to="/chat" />}
					rightIcon={
						<p className={Styles.lastTime}>{
							this.handleLastTime(friend.lastTime)
						}</p>
					}
					secondaryText={
						friend.lastMsg &&
						<p><Twemoji text={htmlDecode(friend.lastMsg.substr(0,200))} /></p>
					}
				/>
	  		);
	  	});
	}

  	render() {
			console.log('Friends list render= ', this.props);
		const { loading, friends } = this.props;
	    return (
			<div>
				<Header name="Friends"/>
				<div className={Styles.FriendList}>
					{loading &&
						<RefreshIndicator
						      size={40}
						      left={10}
						      top={0}
						      status="loading"
						      className={Styles.refresh}
					    />
					}
					{
						friends.length === 0 &&
						!loading &&
						<NoFriends />
					}
					{
						friends.length !== 0 &&
						<List>
							{this.populateFriendsList()}
						</List>
					}
			    </div>
		    </div>
    	);
  	}
}

const mapStateToProps = state => {
	console.log('mapStateToProps in FriendsList index= ', state);
    return {
    	friends: state.friends.friends || [],
    	loading: state.friends.isLoading || false,
			timestamp : state.friends.timestamp || 0,
			lastChats: state.friends.lastChats || {}
    }
}

const mapDispatchToProps = dispatch => {
    return {
        setMeeting: meetingId =>{
            dispatch(setMeeting(meetingId));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(FriendList);
