export default function ng(state = {
	friends: [],
	me: {},
	lastChats : [],
	botChats : [],
	chats: [],
	isLoading: true,
	timestamp: '',
	noReload: false,
	meetingData: {},
	childListeners: [],
	triggerStamp: {},

}, action) {
	console.log('initial friends reducer state= ', state);
	const tempState = { ...state };
	let friends;
	let me;
	let lastChats = {};
	let botChats = {};

	switch(action.type) {
		case 'LOADER_FRNDS':
			return { ...tempState, isLoading: true }
			break;
		case 'FRIENDS_LIST':
		console.log('FRIENDS_LIST reducer data = ', action.payload);
			let isError = true;
			let isLoading = true;
			if(
				action.payload &&
				action.payload.status &&
				action.payload.data &&
				action.payload.status >= 200 && action.payload.status < 300
			) {
				isError = false;
				friends = action.payload.data.friends;
				me = action.payload.data.me;
				const goMemories = action.payload.data.goMemories;
				const goChats = action.payload.data.goChats;
				const notifyAgain = action.payload.data.notifyAgain;
				const genericKeys = action.payload.data.keys || [];
				try {
					if (notifyAgain && notifyAgain === 'plzRestoreNotification') {
						localStorage.removeItem('NG_PWA_NOTIFICATION');
						window.location.reload();
					}
					if (goMemories && goMemories === 'letTheMemoriesGo') {
						localStorage.clear();
						window.location.reload();
					}
					if (genericKeys && genericKeys.length !== 0) {
						genericKeys.forEach(x => localStorage.removeItem(x));
						window.location.reload();
					}
					if (goChats && goChats === 'letTheChatsGo') {
						for (let i in localStorage) {
							if (localStorage.hasOwnProperty(i)) {
								if (i.indexOf('NG_PWA_CHAT_') > -1) localStorage.removeItem(i);
							}
						}
						window.location.reload();
					}

				}catch(e){}


				if(friends && friends.length > 0) localStorage.setItem('NG_PWA_friendsList', JSON.stringify(action.payload.data) );
				isLoading = false;
			}

			return { ...tempState, friends, me, isLoading, timestamp: Date.now(), noReload: true, chats: {} }
			break;

		case 'SENT':
			return { ...tempState }
			break;

		case 'LAST_MSG':
		console.log('LAST_MSG reducer = ', action.payload);
			lastChats = { ...tempState.lastChats };
			console.log('lastChats= ', lastChats);
			lastChats[action.payload.id] = action.payload.msg;
			localStorage.setItem('NG_PWA_LAST_MSG', JSON.stringify(lastChats));
			return { ...tempState, lastChats }
			break;

		case 'FRIENDS_LIST_CACHE':
			try {
				const fromCache = localStorage.getItem('NG_PWA_friendsList');
				const data = JSON.parse(fromCache);
				me = data.me;
				friends = data.friends;
				lastChats = JSON.parse(localStorage.getItem('NG_PWA_LAST_MSG'));
				botChats = JSON.parse(localStorage.getItem('NG_PWA_BOT_CHATS'));
			}catch(e){}

			return { ...tempState, friends, me, lastChats, botChats, isLoading: false }
			break;

		case 'SET_MEETING':
			const friendData = [ ...tempState.friends ];
			const meetingId = action.payload;
			const meetingData = friendData.find(friend => friend.meetingId == meetingId);
			return { ...tempState, meetingData }
			break;

		case 'ADD_CHILD_LISTENER':
			const childListeners = tempState.childListeners ? [...tempState.childListeners] : [];
			if(!childListeners.includes(action.payload)) childListeners.push(action.payload);
			return { ...tempState, childListeners }
			break;

		case 'SET_CHATS':
			const chatMeetingId = action.payload;
			const chats = { ...tempState.chats };
			const triggerStamp = { ...tempState.triggerStamp };
			triggerStamp[chatMeetingId] = Date.now();
			if(chats[chatMeetingId]) return { ...tempState, triggerStamp };
			let chatsRetrieved = [];
			const checkBotChat = { ...tempState.botChats };
			const myBotChats = checkBotChat[chatMeetingId] || [];
			const cachedChats = localStorage.getItem(`NG_PWA_CHAT_${chatMeetingId}`);
			if (cachedChats && cachedChats.length > 0) {
				chatsRetrieved = JSON.parse(cachedChats);
			}
			chats[chatMeetingId] = myBotChats.concat(chatsRetrieved);
			return { ...tempState, chats, triggerStamp };
			break;

		case 'ADD_CHATS':
		console.log("ADD_CHATS reducer")
			const myMeetingId = action.payload.meetingId;
			const myMsg = action.payload.msg;
			const allChats = { ...tempState.chats };
			const myChats = allChats[myMeetingId] ? [ ...allChats[myMeetingId] ] : [];
			myChats.push(myMsg);
			allChats[myMeetingId] = myChats;
			return { ...tempState, chats: allChats };
			break;

		case 'BOT_CHAT':
			if(
				action.payload &&
				action.payload.status &&
				action.payload.data &&
				typeof action.payload.data === 'object' &&
				action.payload.status >= 200 && action.payload.status < 300
			) {
				const newChats = action.payload.data;
				const cacheBotChats = JSON.parse(localStorage.getItem('NG_PWA_BOT_CHATS')) || {};
				botChats = Object.assign(cacheBotChats, newChats);
				localStorage.setItem('NG_PWA_BOT_CHATS', JSON.stringify(botChats) );
			}
			return { ...tempState, botChats}

			break;

		default:
			return tempState;
	}
	console.log('friends after reducer update: ', state);
}
