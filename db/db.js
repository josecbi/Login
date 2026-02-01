import { open } from 'sqlite'
import sqlite3 from 'sqlite3'

export async function getConnection() {
    return open({
        filename: 'login.db',
        driver: sqlite3.Database
    })
}