import { styled } from '@mui/material/styles';
import { Box, Card, Container } from '@mui/material';

export const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  minHeight: '100vh',
  position: 'relative',
}));

export const GlassCard = styled(Card)(({ theme }) => ({
  background: 'rgba(30, 30, 30, 0.95) !important',
  backdropFilter: 'blur(20px)',
  borderRadius: theme.spacing(2),
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
  position: 'relative',
  zIndex: 1,
  transition: 'all 0.3s ease',
  color: '#ffffff !important',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.4)',
    background: 'rgba(30, 30, 30, 0.98) !important',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  '& *': {
    color: '#ffffff !important',
  }
}));

export const SearchBox = styled(Box)(({ theme }) => ({
  background: 'rgba(30, 30, 30, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.3)',
  position: 'relative',
  zIndex: 1,
  '& .MuiTextField-root': {
    '& .MuiOutlinedInput-root': {
      background: 'rgba(255, 255, 255, 0.05)',
      color: '#ffffff',
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.3)',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.4)',
      },
      '& input': {
        color: '#ffffff !important',
        '&::placeholder': {
          color: 'rgba(255, 255, 255, 0.5)',
          opacity: 1,
        }
      }
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
      '&.Mui-focused': {
        color: 'rgba(255, 255, 255, 0.9)',
      }
    }
  }
}));

export const CustomerCard = styled(Card)(({ theme }) => ({
  background: 'rgba(30, 30, 30, 0.95) !important',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(1.5),
  border: '1px solid rgba(255, 255, 255, 0.1)',
  marginBottom: theme.spacing(2),
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px 0 rgba(0, 0, 0, 0.4)',
    background: 'rgba(30, 30, 30, 0.98) !important',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  '& .MuiCardContent-root': {
    padding: theme.spacing(2),
    background: 'transparent !important',
  },
  '& .MuiTypography-root': {
    color: '#ffffff !important',
  },
  '& .MuiChip-root': {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#ffffff !important',
    '& .MuiChip-label': {
      color: '#ffffff !important',
    }
  },
  '& .MuiAvatar-root': {
    background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
    color: 'white',
    fontWeight: 'bold',
  },
  '& .MuiSvgIcon-root': {
    color: 'rgba(255, 255, 255, 0.8) !important',
  }
}));

export const HeaderBox = styled(Box)(({ theme }) => ({
  background: 'rgba(30, 30, 30, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.3)',
  position: 'relative',
  zIndex: 1,
  '& .MuiTypography-h4': {
    color: '#ffffff !important',
    fontWeight: 700,
  },
  '& .MuiButton-root': {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff !important',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.15)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
    }
  }
}));