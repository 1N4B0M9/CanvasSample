import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// chip colors per type — matches the spec
const TYPE_CHIP = {
	mentor: { bg: '#dbeafe', color: '#1d4ed8' },
	image: { bg: '#dcfce7', color: '#15803d' },
	text: { bg: '#f3f4f6', color: '#374151' },
	connection: { bg: '#ede9fe', color: '#6d28d9' },
	arrow: { bg: '#fef9c3', color: '#854d0e' },
};

const DeleteConfirmModal = ({ open, summary, onClose, onConfirm }) => {
	if (!summary) return null;
	const { items, implicitCount } = summary;

	return (
		<Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
			<DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
				<Box
					sx={{
						width: 32,
						height: 32,
						bgcolor: '#fef2f2',
						borderRadius: 2,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: 16,
						flexShrink: 0,
					}}
				>
					🗑
				</Box>
				<Box>
					<Typography variant="subtitle1" fontWeight={600}>
						Delete {items.length} item{items.length !== 1 ? 's' : ''}?
					</Typography>
					<Typography variant="caption" color="text.secondary">
						This can't be undone.
					</Typography>
				</Box>
			</DialogTitle>

			<DialogContent dividers sx={{ px: 3, py: 1 }}>
				{items.map((item) => {
					const chipStyle = TYPE_CHIP[item.type] || TYPE_CHIP.text;
					return (
						<Box
							key={item.id}
							sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, borderBottom: '1px solid #f9fafb' }}
						>
							<Chip
								label={item.type}
								size="small"
								sx={{ bgcolor: chipStyle.bg, color: chipStyle.color, fontWeight: 500 }}
							/>
							{item.label ? (
								<Typography variant="body2">{item.label}</Typography>
							) : (
								<Typography variant="body2" color="text.disabled" fontStyle="italic">
									no label
								</Typography>
							)}
						</Box>
					);
				})}
			</DialogContent>

			{implicitCount > 0 && (
				<Box sx={{ px: 3, py: 1, bgcolor: '#fafafa', borderTop: '1px solid #f3f4f6' }}>
					<Typography variant="caption" color="text.disabled">
						+ {implicitCount} attached connection{implicitCount !== 1 ? 's' : ''} will also be removed
					</Typography>
				</Box>
			)}

			<DialogActions sx={{ px: 3, py: 2 }}>
				<Button onClick={onClose} variant="outlined" color="inherit" size="small">
					Cancel
				</Button>
				<Button onClick={onConfirm} variant="contained" color="error" size="small">
					Delete all
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default DeleteConfirmModal;
