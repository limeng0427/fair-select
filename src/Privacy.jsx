import { Box, CssBaseline, Divider, Paper, Typography } from '@mui/material'

export default function Privacy() {
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
            Privacy Policy
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Last updated: February 2026
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Section title="1. Overview">
            TL Lab ("we", "us", or "our") operates Fair Select (the "Service"). This Privacy Policy explains
            how we collect, use, and protect information when you use our Service.
          </Section>

          <Section title="2. Information We Collect">
            Fair Select runs entirely in your browser. We do not collect or store any personal data on our
            servers. All data you enter (names, lists, settings) is saved locally in your browser's
            localStorage and never transmitted to us.
            <br /><br />
            We use Google Analytics to collect anonymous usage data such as page views, session duration,
            and general geographic region. This data is aggregated and does not identify you personally.
          </Section>

          <Section title="3. Cookies and Tracking">
            Google Analytics uses cookies to distinguish users. You can opt out of Google Analytics
            tracking by using the{' '}
            <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
              Google Analytics Opt-out Browser Add-on
            </a>
            . We do not use any other tracking technologies.
          </Section>

          <Section title="4. Local Storage">
            The Service stores your people lists and settings in your browser's localStorage to persist
            data between sessions. This data remains on your device and is never sent to our servers.
            You can clear this data at any time through your browser settings or by using the Reset
            function within the app.
          </Section>

          <Section title="5. Third-Party Services">
            We use the following third-party services:
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li><strong>Google Analytics</strong> — anonymous usage analytics. See Google's{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
              </li>
            </ul>
          </Section>

          <Section title="6. Children's Privacy">
            Our Service is not directed at children under 13. We do not knowingly collect personal
            information from children.
          </Section>

          <Section title="7. Changes to This Policy">
            We may update this Privacy Policy from time to time. Changes will be posted on this page
            with an updated date. Continued use of the Service after changes constitutes acceptance
            of the updated policy.
          </Section>

          <Section title="8. Contact">
            If you have any questions about this Privacy Policy, please contact us at{' '}
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
