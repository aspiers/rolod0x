import { Fragment } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
// import { List, ListItem, ListItemText } from '@mui/material';

import Rolod0xText from '../../components/Rolod0xText';

import './Donate.css';

export default function Donate() {
  const theme = useTheme();
  const StyledCode = styled('code')`
    color: ${theme.palette.secondary.light};
  `;
  return (
    <Fragment>
      <Typography variant="h4" component="h2">
        Support <Rolod0xText />!
      </Typography>
      <Typography paragraph>
        If you find this project helpful and would like to support its development, you can make a
        donation using the following cryptocurrency addresses:
      </Typography>
      <ul>
        <li>
          Send <strong>Bitcoin</strong> to:{' '}
          <StyledCode>bc1quuspvrjepx63k5hpydwqkf6nmtt9eqm86y8w8a</StyledCode>
        </li>
        <li>
          Send <strong>ETH</strong> or tokens on any Ethereum network to:{' '}
          <StyledCode>rolod0x.eth</StyledCode>
          <br />
          (N.B. that's a zero before the <StyledCode>x</StyledCode>, not an uppercase{' '}
          <StyledCode>O</StyledCode> &mdash; the address should resolve to{' '}
          <StyledCode>0x06357397d8078C19195f4555db7A407b1b1f5FB3</StyledCode>.)
        </li>
      </ul>
      <Typography paragraph>
        Your contribution will go directly towards enhancing the project, covering development
        costs, and supporting ongoing maintenance.
      </Typography>
      <Typography paragraph>
        We appreciate every donation, no matter the size. It helps to ensure the project's
        sustainability and motivates us to continue delivering valuable updates and improvements.
      </Typography>
      <Typography paragraph>Thank you for considering a donation to support our work!</Typography>
    </Fragment>
  );
}