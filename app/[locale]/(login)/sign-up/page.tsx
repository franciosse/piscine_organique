import { Suspense } from 'react';
import { Login } from '../../components/login';

export default function SignUpPage() {
  return (
    <Suspense>
      <Login mode="signup" />
    </Suspense>
  );
}
