import React, { Component } from 'react';
import { connect } from 'react-redux';

import Avatar from 'material-ui/Avatar';
import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';
import RefreshIndicator from 'material-ui/RefreshIndicator';
import {grey400, darkBlack, lightBlack} from 'material-ui/styles/colors';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';

import Header from '../Header';
import { getNotifications, getNotificationsCache } from '../../actions/notification';

import Styles from './style.scss';


class Notifications extends Component {

    constructor(props) {
        super(props);
    }

    componentWillMount() {
        this.props.getNotificationsCache();
    }

    componentDidMount() {
        if(navigator.onLine) {
            const nowTime = Date.now();
            const thenTime = parseInt(this.props.timestamp,10);
            if(Math.abs(nowTime - thenTime) > 60000) this.props.getNotifications();
        }
    }

    populateNotifications() {
        const { notifications } = this.props;
        const AvtarUrl = 'https://s3-us-west-2.amazonaws.com/wisp-image/ng/thumb/50_50_profile_'  //'https://img.neargroup.me/project/forcesize/65x65/pixelate_3/profile_';
        const iconButtonElement = (
            <IconButton touch={true} >
                <MoreVertIcon color={grey400} />
            </IconButton>
        );
        const rightIconMenu = (
            <IconMenu iconButtonElement={iconButtonElement}>
                <MenuItem>Reply</MenuItem>
                <MenuItem>Delete</MenuItem>
            </IconMenu>
        );

        return notifications.map( (notification, index) => {
            return (
                <ListItem
                    primaryText={notification.name}
                    secondaryText={<div dangerouslySetInnerHTML={{__html: notification.mess}} />}
                    secondaryTextLines={2}
                    rightIconButton={rightIconMenu}
                    leftAvatar={<Avatar src={`${AvtarUrl}${notification.channelid}`} />}
                    key={`${notification.channelid}${index}`}
                />
            );
        });
    }

    render() {
        const { loading } = this.props;
        return (
            <div>
                <Header name="Notifications"/>
                {loading &&
                    <RefreshIndicator
                          size={40}
                          left={10}
                          top={0}
                          status="loading"
                          className={Styles.refresh}
                    />
                }
                <div className={Styles.Notifications}>
                    <List>
                        {this.populateNotifications()}
                    </List>
                </div>
            </div>
        );
    }
}

const mapDispatchToProps = dispatch => {
    return {
        getNotifications: () =>{
            dispatch(getNotifications());
        },
        getNotificationsCache: () =>{
            dispatch(getNotificationsCache());
        }
    }
}

const mapStateToProps = state => {
    return {
        notifications: state.notifications.list || [],
        loading: state.notifications.isLoading || false,
        timestamp : state.notifications.timestamp || 0,
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Notifications);
