import axios from 'axios';
import Store from '../reducers/store';

export function showLoader() {
    return {
        type: 'LOADER_FRNDS',
        payload: true
    };
}

export const getFriends = (authId = '') => {
    console.log('in getFriends ---- ', authId);
    const startTime = localStorage.getItem(`NG_PWA_START`) || Date.now();
    Store.dispatch(showLoader());
    let url_ =  `https://wisp.neargroup.me/wisp/getFriends?id=${authId}&t=${startTime}`
    console.log('getFriends url = ', url_);
    return axios({
        method: 'GET',
        url: `${API}getFriends?id=${authId}&t=${startTime}`, //https://f0c3572e.ngrok.io/NG/
        // url: url_,
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then( response => {
      console.log('get friends response= ', response);
        return {
            type: 'FRIENDS_LIST',
            payload: response
        }
    })
    .catch( error => {
      console.log('get friends error= ', error);
        return {
            type: 'FRIENDS_LIST',
            payload: { data: 0, error }
        }
    });
}

export const getFriendsChat = (channelId, friends) => {
  console.log('GET FRIENDS CHAT - channelId, friends = ', channelId, friends);
    return axios({
        method: 'POST',
        url: `${API}getFriendsChat`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: {
            channelId,
            friends
        }
    })
    .then( response => {
      console.log('GET FRIENDS CHAT - api response = ', response);
        return {
            type: 'BOT_CHAT',
            payload: response
        }
    })
    .catch( error => {
      console.log('GET FRIENDS CHAT - api error = ', error);
        return {
            type: 'BOT_CHAT',
            payload: { data: 0, error }
        }
    });
}

export const sendPush = data => {
    if(typeof data === 'object') data.isRegistered = 1;
    return axios({
        method: 'POST',
        url: `${API}notifyUser`,
        data
    })
    .then( response => {
        return {
            type: 'SENT',
            payload: response
        }
    });
}

export const getFriendsCache = () => {
    return {
        type: 'FRIENDS_LIST_CACHE',
        payload: true
    }
}

export const getLastMsg = (id, msg) => {
    return {
        type: 'LAST_MSG',
        payload: { id, msg }
    }
}

export const setMeeting = meetingId => {
    return {
        type: 'SET_MEETING',
        payload: meetingId
    }
}

export const addChildListener = meetingId => {
    return {
        type: 'ADD_CHILD_LISTENER',
        payload: meetingId
    }
}

export const setChats = meetingId => {
    return {
        type: 'SET_CHATS',
        payload: meetingId
    }
}

export const addChats = (meetingId, msg) => {
    return {
        type: 'ADD_CHATS',
        payload: { meetingId, msg }
    }
}
