import brcypt from 'bcrypt';
import { isBoxedPrimitive } from 'node:util/types';

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
    return brcypt.hash(plain, ROUNDS);
}

export async function verifyPassword(
    plain: string,
    hash: string,
): Promise<boolean> {
    return brcypt.compare(plain, hash);
};