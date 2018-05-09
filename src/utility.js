const ascCompare = (a,b) => {
	if (a.created < b.created)
		return -1;
	if (a.created > b.created)
		return 1;
	return 0;
}

const descCompare = (a,b) => {
	if (a.lastTime > b.lastTime)
		return -1;
	if (a.lastTime < b.lastTime)
		return 1;
	return 0;
}

export const htmlDecode = msg => {
	try {
		msg = msg.replace(/<(?:.|\n)*?>/gm, '');
		const dummyElement = document.createElement('p');
		// dummyElement.innerHTML = msg;
		dummyElement.innerHTML = decodeURIComponent(JSON.parse('"' + msg.replace(/\"/g, '\\"') + '"') ) ;

		const renderedContent = dummyElement.textContent;
		return renderedContent;
	}catch(e) {
		return msg;
	}
}

export const sortFriendList = (friends, lastMessage) => {
	const sortedFriends = [];
	if(friends.length !== 0) {
		friends.forEach(friend => {
			const theFriend = { ...friend };
			if(lastMessage && lastMessage[friend.meetingId]) {
				theFriend.lastMsg = lastMessage[friend.meetingId].msg;
				theFriend.lastTime = lastMessage[friend.meetingId].sentTime;
			} else {
				theFriend.lastTime = 0;
			}
			sortedFriends.push(theFriend);
		});
		return sortedFriends.sort(descCompare);
	}
	return friends;
}

export const formatTime = t => {
	if(!t) return '';
	const dateObj = new Date(parseInt(t, 10));
	const tym = dateObj.toLocaleTimeString();
	return `${tym.substring(0, 5)} ${tym.substr(tym.length - 2)}`;
}

export const formatDate = t => {
	if(!t) return '';
	const dateObj = new Date(parseInt(t, 10));
	return dateObj.toDateString().substr(4);
}
