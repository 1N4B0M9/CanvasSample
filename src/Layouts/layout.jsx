import PropTypes from 'prop-types';
import Navbar from './Navbar';
import Footer from './Footer';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
	// Checking current pathname to make sure layout disappears for canvas page
	const location = useLocation();
	const pathname = location.pathname;

	return (
		<>
			{pathname === '/FutureEnvisioning' ? <></> : <Navbar />}
			{/* Controlling padding via pathname removed mt-36 on index.css */}
			<div className={`px-5 md:px-0 ${pathname !== '/FutureEnvisioning' ? 'mt-36' : ''}`}>{children}</div>
			{pathname === '/FutureEnvisioning' ? <></> : <Footer />}
		</>
	);
};

Layout.propTypes = {
	children: PropTypes.node.isRequired,
};

export default Layout;
