import { Redirect } from 'expo-router';

/** Withdraw – enter amount shares the Top up screen. */
export default function Withdraw() {
  return <Redirect href={{ pathname: '/wallet/top-up', params: { mode: 'withdraw' } }} />;
}
