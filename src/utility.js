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

const newCompare = (a,b) => {
	if (a.newfriend != undefined && b.newfriend == undefined)
		return -1;
	if (b.newfriend != undefined && a.newfriend == undefined)
		return 1;
	if (a.newfriend != undefined && a.newfriend != undefined)
		return 0;
	return 0;
}

export const htmlDecode = msg => {
	console.log("htmlDecode= ", msg);
	try {
		msg = msg.replace(/<(?:.|\n)*?>/gm, '');
		const dummyElement = document.createElement('p');
		dummyElement.innerHTML = decodeURIComponent(JSON.parse('"' + msg.replace(/\"/g, '\\"') + '"') );
		const renderedContent = dummyElement.textContent;
		return renderedContent;
	}catch(e) {
		return msg;
	}
}

export const sortFriendList = (friends, lastMessage) => {
	// console.log("in sortFriendList= ", friends, lastMessage);
	var sortedFriends = [];
	var oldFriends = []
	var newAdditons = []
	if(friends.length !== 0) {
		friends.forEach(friend => {
			const theFriend = { ...friend };
			// console.log("theFriend = ", theFriend);
			if(theFriend.newfriend != undefined && theFriend.newfriend ) {
				newAdditons.push(friend)
			} else {
				if(lastMessage && lastMessage[friend.meetingId]) {
					theFriend.lastMsg = lastMessage[friend.meetingId].msg;
					theFriend.lastTime = lastMessage[friend.meetingId].sentTime;
					theFriend.msgFrom = lastMessage[friend.meetingId].fromId;
				} else {
					theFriend.lastTime = 0;
				}
				oldFriends.push(theFriend)
			}
			// console.log("new theFriends= ", theFriend);
			// sortedFriends.push(theFriend);
		});
		// return sortedFriends.sort(descCompare);
		// return sortNewFriends(sortedFriends.sort(descCompare))
		sortedFriends = oldFriends.sort(descCompare)
		return [...newAdditons, ...sortedFriends]
	}
	return friends;
}

export const sortNewFriends = friends => {
	console.log("in sortNewFriends= ", friends);
	// return friends.sort(newCompare)
	// let finalOrder = []
	// friends.forEach(item => {
	// 	if(item.newFriends)
	// })

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
