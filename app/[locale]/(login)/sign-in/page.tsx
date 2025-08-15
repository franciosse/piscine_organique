import { Suspense } from 'react';
import { Login } from '../../components/login';

export default function SignInPage() {
  return (
    <Suspense>
      <Login mode="signin" />
    </Suspense>
  );
}
