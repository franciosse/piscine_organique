'use client';
import React, { useState, useEffect } from 'react';

import { AllUsers } from '@/app/[locale]/components/admin/users';

export default function UsersPage() {
    return (
        <div>
            <h1>Users</h1>
            <AllUsers />
        </div>
    );
}
