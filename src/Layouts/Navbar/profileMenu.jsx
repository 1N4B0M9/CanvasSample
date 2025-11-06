import { useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Snackbar from '@mui/material/Snackbar';
import MenuItem from '@mui/material/MenuItem';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { logout } from '../../firebase/firebase';
import { useAuth } from '../../firebase/AuthContext';
import PATHS from '../../paths';
import getUserData from '../../components/getUserData';

// isCanvas indicator is for handling display of login module on Canvas Side
const ProfileMenu = ({ isMobile, isCanvas }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [dataDisplayErrorMsg, setDataDisplayErrorMsg] = useState('');
	const [settings, setSettings] = useState([]);
	const [userData, setUserData] = useState(null);
	const { currentUser, loading } = useAuth();
	const [anchorEl, setAnchorEl] = useState(null);
	const isMenuOpen = Boolean(anchorEl);
	const [notification, setNotification] = useState('');

	const showMenu = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const closeMenu = () => {
		setAnchorEl(null);
	};

	const handleLogout = () => {
		logout();
		// reload page on logout
		window.location.reload();
		setNotification('You have been logged out');
	};

	useEffect(() => {
		// preventing immature function triggers
		const handleIncomingUserData = async (uid, email) => {
			try {
				setIsLoading(true);
				const userData = await getUserData(uid);
				setUserData(userData);
				setIsLoading(false);
			} catch (err) {
				setIsLoading(false);
				setDataDisplayErrorMsg('Error While fetching data');
				console.log(`Error Fetching user document data for UID & Email : [${uid}, ${email}]`);
			}
		};

		if (currentUser) {
			handleIncomingUserData(currentUser.uid, currentUser.email);
			if (currentUser.uid === process.env.REACT_APP_ADMIN_UID) {
				setSettings([
					{
						name: 'Log Out',
						onClick: handleLogout,
					},
					{ name: 'Add Videos', href: PATHS.addVideos },
					{ name: 'Add Quiz Question', href: PATHS.addQuizQuestions },
					{ name: 'Restore Videos', href: PATHS.restoreVideos },
					{
						name: 'Help Manager',
						href: PATHS.helpManager,
					},
				]);
			} else {
				setSettings([
					{
						name: 'Log Out',
						onClick: handleLogout,
					},
				]);
			}
		} else {
			setSettings([
				{
					name: 'Log In',
					href: PATHS.login,
				},
			]);
		}
	}, [currentUser, loading]);

	return (
		<>
			{isCanvas ? (
				<div
					onClick={showMenu}
					className="flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-gray-100 border border-gray-300 bg-white shadow rounded-lg"
				>
					{isLoading ? (
						<p>Fetching data...</p>
					) : dataDisplayErrorMsg ? (
						<p className="text-red-500 text-sm">{dataDisplayErrorMsg}</p>
					) : (
						<>
							<AccountCircle />
							{currentUser?.email && (
								<span className="text-sm text-gray-700 font-medium">{userData?.name || currentUser.email}</span>
							)}
						</>
					)}
				</div>
			) : isMobile ? (
				<ListItemButton
					size="large"
					edge="end"
					aria-label="account of current user"
					aria-controls="menu-appbar"
					aria-haspopup="true"
					onClick={showMenu}
					color="inherit"
				>
					<ListItemIcon>
						<AccountCircle />
					</ListItemIcon>
					<ListItemText
						primary={
							isLoading ? (
								'Loading...'
							) : dataDisplayErrorMsg ? (
								<span className="text-red-500 text-sm">{dataDisplayErrorMsg}</span>
							) : (
								userData?.name || 'Profile'
							)
						}
					/>
				</ListItemButton>
			) : (
				<IconButton
					size="large"
					edge="end"
					aria-label="account of current user"
					aria-controls="menu-appbar"
					aria-haspopup="true"
					onClick={showMenu}
					color="inherit"
				>
					<AccountCircle />
					{/* 👇 name beside profile on all non-canvas pages */}
					{!isCanvas && currentUser && (
						<span
							style={{
								marginLeft: '8px',
								fontSize: '0.9rem',
								color: '#333',
								fontWeight: 500,
							}}
						>
							{isLoading ? 'Loading...' : dataDisplayErrorMsg ? 'Error' : userData?.name || currentUser.email}
						</span>
					)}
				</IconButton>
			)}

			{/* menu + snackbar remain unchanged */}
			<Menu
				id="menu-appbar"
				anchorEl={anchorEl}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'right',
				}}
				keepMounted
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
				open={isMenuOpen}
				onClose={closeMenu}
			>
				{settings.map((option) => (
					<MenuItem
						key={option.name}
						component={option.href ? Link : 'button'}
						to={option.href}
						onClick={() => {
							if (option.onClick) option.onClick();
							closeMenu();
						}}
					>
						{option.name}
					</MenuItem>
				))}
			</Menu>
			<Snackbar
				open={notification !== ''}
				autoHideDuration={6000}
				onClose={() => setNotification('')}
				message={notification}
			/>
		</>
	);
};

ProfileMenu.propTypes = {
	isMobile: PropTypes.bool,
};

ProfileMenu.defaultProps = {
	isMobile: false,
};

export default ProfileMenu;
