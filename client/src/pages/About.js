import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Paper,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
}));

const About = () => {
  const teamMembers = [
    {
      name: 'John Doe',
      role: 'CEO & Founder',
      image: 'https://randomuser.me/api/portraits/men/1.jpg',
      bio: 'With over 15 years of experience in the hospitality industry, John leads our team with vision and passion.',
    },
    {
      name: 'Jane Smith',
      role: 'CTO',
      image: 'https://randomuser.me/api/portraits/women/1.jpg',
      bio: 'Jane brings technical expertise and innovation to our platform, ensuring the best user experience.',
    },
    {
      name: 'Mike Johnson',
      role: 'Head of Operations',
      image: 'https://randomuser.me/api/portraits/men/2.jpg',
      bio: 'Mike oversees our day-to-day operations, ensuring smooth service delivery to our customers.',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <StyledPaper elevation={3}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            About Us
          </Typography>
          <Typography variant="body1" paragraph>
            Welcome to Hotel Booking, your premier destination for finding and booking the perfect hotel for your travels.
            Founded in 2020, we've grown from a small startup to a leading platform in the hospitality industry.
          </Typography>
          <Typography variant="body1" paragraph>
            Our mission is to make hotel booking simple, transparent, and enjoyable. We work with thousands of hotels
            worldwide to provide you with the best options for your stay, whether you're traveling for business or leisure.
          </Typography>
        </StyledPaper>

        <StyledPaper elevation={3}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Our Values
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card elevation={0}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Transparency
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    We believe in clear pricing and honest information about hotels and their amenities.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={0}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Customer Focus
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your satisfaction is our priority. We're committed to providing excellent service and support.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={0}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Innovation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    We continuously improve our platform to offer the best booking experience possible.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </StyledPaper>

        <StyledPaper elevation={3}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Our Team
          </Typography>
          <Grid container spacing={4}>
            {teamMembers.map((member) => (
              <Grid item xs={12} md={4} key={member.name}>
                <Card elevation={0}>
                  <CardMedia
                    component="img"
                    height="300"
                    image={member.image}
                    alt={member.name}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {member.name}
                    </Typography>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      {member.role}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {member.bio}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </StyledPaper>

        <StyledPaper elevation={3}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Our Achievements
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h3" color="primary">
                  1M+
                </Typography>
                <Typography variant="subtitle1">
                  Happy Customers
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h3" color="primary">
                  10K+
                </Typography>
                <Typography variant="subtitle1">
                  Partner Hotels
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h3" color="primary">
                  50+
                </Typography>
                <Typography variant="subtitle1">
                  Countries
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </StyledPaper>
      </Box>
    </Container>
  );
};

export default About; 