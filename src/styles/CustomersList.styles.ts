import { styled } from '@mui/material/styles';
import { Box, Card, Container } from '@mui/material';

export const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.3)',
    zIndex: 0,
  }
}));

export const GlassCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  borderRadius: theme.spacing(2),
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  position: 'relative',
  zIndex: 1,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.45)',
    background: 'rgba(255, 255, 255, 0.98)',
  }
}));

export const SearchBox = styled(Box)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 4px 20px 0 rgba(31, 38, 135, 0.2)',
  position: 'relative',
  zIndex: 1,
  '& .MuiTextField-root': {
    '& .MuiOutlinedInput-root': {
      background: 'rgba(255, 255, 255, 0.9)',
      '& fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.23)',
      },
      '&:hover fieldset': {
        borderColor: theme.palette.primary.main,
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
      },
      '& input': {
        color: theme.palette.text.primary,
      }
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(0, 0, 0, 0.6)',
      '&.Mui-focused': {
        color: theme.palette.primary.main,
      }
    }
  }
}));

export const CustomerCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.98)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(1.5),
  border: '1px solid rgba(255, 255, 255, 0.5)',
  marginBottom: theme.spacing(2),
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px 0 rgba(0, 0, 0, 0.15)',
    background: 'white',
  },
  '& .MuiCardContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiTypography-root': {
    color: theme.palette.text.primary,
  },
  '& .MuiChip-root': {
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    '& .MuiChip-label': {
      color: theme.palette.text.primary,
    }
  },
  '& .MuiAvatar-root': {
    background: theme.palette.primary.main,
    color: 'white',
    fontWeight: 'bold',
  }
}));

export const HeaderBox = styled(Box)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 4px 20px 0 rgba(31, 38, 135, 0.2)',
  position: 'relative',
  zIndex: 1,
  '& .MuiTypography-h4': {
    color: theme.palette.text.primary,
    fontWeight: 700,
  },
  '& .MuiButton-root': {
    background: theme.palette.primary.main,
    color: 'white',
    '&:hover': {
      background: theme.palette.primary.dark,
    }
  }
}));