import { Box, CssBaseline, Divider, Paper, Typography } from '@mui/material'

export default function Terms() {
  return (
    <>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: { xs: 2, sm: 4 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <Paper elevation={8} sx={{ borderRadius: 4, p: { xs: 3, sm: 5 }, width: '100%', maxWidth: 680 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#4c3a8e', mb: 0.5 }}>
            Terms of Service
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Last updated: February 2026
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Section title="1. Acceptance of Terms">
            By accessing or using Fair Select (the "Service") provided by TL Lab ("we", "us", or "our"),
            you agree to be bound by these Terms of Service. If you do not agree, please do not use
            the Service.
          </Section>

          <Section title="2. Description of Service">
            Fair Select is a free, browser-based random person picker and draw selector tool. It allows
            you to enter names and randomly select from them using various display modes and themes.
            All functionality runs locally in your browser.
          </Section>

          <Section title="3. Use of the Service">
            You may use the Service for any lawful purpose. You agree not to:
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li>Use the Service for any unlawful or fraudulent purpose</li>
              <li>Attempt to interfere with or disrupt the Service</li>
              <li>Use the Service in any way that could damage, disable, or impair it</li>
            </ul>
          </Section>

          <Section title="4. No Account Required">
            The Service does not require you to create an account. All data you enter is stored
            locally in your browser and is not accessible to us.
          </Section>

          <Section title="5. Intellectual Property">
            The Service and its original content, features, and functionality are owned by TL Lab
            and are protected by applicable intellectual property laws. You may not copy, modify,
            distribute, or reverse engineer any part of the Service without our prior written consent.
          </Section>

          <Section title="6. Disclaimer of Warranties">
            The Service is provided "as is" and "as available" without warranties of any kind,
            either express or implied. We do not warrant that the Service will be uninterrupted,
            error-free, or free of viruses or other harmful components. Your use of the Service
            is at your sole risk.
          </Section>

          <Section title="7. Limitation of Liability">
            To the fullest extent permitted by law, TL Lab shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising from your use of or
            inability to use the Service.
          </Section>

          <Section title="8. Third-Party Links">
            The Service may contain links to third-party websites. We have no control over and
            assume no responsibility for the content, privacy policies, or practices of any
            third-party sites. We encourage you to review the terms and privacy policies of any
            third-party sites you visit.
          </Section>

          <Section title="9. Changes to Terms">
            We reserve the right to modify these Terms at any time. Changes will be posted on this
            page with an updated date. Continued use of the Service after any changes constitutes
            your acceptance of the new Terms.
          </Section>

          <Section title="10. Governing Law">
            These Terms shall be governed by and construed in accordance with the laws of New Zealand,
            without regard to its conflict of law provisions.
          </Section>

          <Section title="11. Contact">
            If you have any questions about these Terms, please contact us at{' '}
            <a href="https://techlead.co.nz" target="_blank" rel="noopener noreferrer">techlead.co.nz</a>.
          </Section>
        </Paper>

        <Footer />
      </Box>
    </>
  )
}

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#4c3a8e', mb: 0.75 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
        {children}
      </Typography>
    </Box>
  )
}

function Footer() {
  return (
    <Box sx={{ textAlign: 'center', mt: 3, pb: 1 }}>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mb: 0.5 }}>
        © 2026 TL Lab. All rights reserved.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
        <Typography
          component="a"
          href="/"
          variant="caption"
          sx={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', '&:hover': { color: 'white' } }}
        >
          Home
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>·</Typography>
        <Typography
          component="a"
          href="/privacy"
          variant="caption"
          sx={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', '&:hover': { color: 'white' } }}
        >
          Privacy
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>·</Typography>
        <Typography
          component="a"
          href="/terms"
          variant="caption"
          sx={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', '&:hover': { color: 'white' } }}
        >
          Terms of Service
        </Typography>
      </Box>
    </Box>
  )
}
