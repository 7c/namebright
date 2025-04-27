# NameBright API Client
A TypeScript client for the [NameBright REST API](https://api.namebright.com). This library provides a typed, lightweight wrapper for managing domains, nameservers, renewals, and account details, with automatic token management and debug logging.


- API Documentation at https://api.namebright.com/rest/Help
- Examples at https://github.com/NameBright/DomainApiClientExamples
- Access to API Requires special authorization from Registrar applied at legacy url https://legacy.namebright.com/Settings#Api

## Installation
`npm i namebright --save`


## Features

- **Automatic Token Management**: Handles token fetching and caching.
- **Typed Interfaces**: Strongly-typed responses for account, domains, nameservers, and renewals.
- **Debug Logging**: Built-in logging via the `debug` package.
- **Custom Requests**: Access the underlying Axios instance for flexibility.
- **Comprehensive API**: Supports domain queries, nameserver updates, renewals, and account summaries.

## Installation

Install the package via npm:

```bash
npm install --save namebright
```

## IP Restriction
You might get `400 Usage Violation` if you have not added a whitelisted ip inside your account at [https://legacy.namebright.com/Settings#Api], so IP Whitelisting seems to be mandatory. I have tried to whitelist all IPs with '0.0.0.0' but it did not work. You might check [ip8.com](https://ip8.com) to get your external IP and whitelist it.


## Usage

### Initialize the Client

Create a `NameBright` instance with your authentication credentials:

```typescript
import { NameBright, AuthConfig } from 'namebright';

const auth: AuthConfig = {
  accountLogin: 'your-account-login',
  appName: 'your-app-name',
  appSecret: 'your-app-secret',
};

const client = new NameBright(auth);
```

Override the default API URL if needed:

```typescript
const client = new NameBright(auth, { apiUrl: 'https://custom-api.namebright.com' });
```

### Examples

#### Get Account Balance

```typescript
const account = await client.getAccount();
console.log('Account Balance:', account.AccountBalance);
```

#### List Domains

```typescript
const domains = await client.getDomains(1, 20);
console.log('First 20 Domains:', domains);
```

#### Get Domain Details

```typescript
const domain = await client.getDomain('example.com');
console.log('Domain Status:', domain.Status);
```

#### Renew a Domain

```typescript
const renewal = await client.renewDomain('example.com', 2);
console.log('Renewal Order ID:', renewal.OrderId);
```

#### Manage Nameservers

```typescript
const nameservers = await client.getNameservers('example.com');
console.log('Nameservers:', nameservers);

const newNameservers = ['ns1.example.com', 'ns2.example.com'];
const applied = await client.setNameservers('example.com', newNameservers);
console.log('Applied Nameservers:', applied);
```

#### Custom Requests

Use the underlying Axios instance for custom API calls:

```typescript
const axiosInstance = client.getClient();
const response = await axiosInstance.get('/rest/custom/endpoint');
console.log('Custom Response:', response.data);
```

## Configuration

### Authentication

Required credentials:

- `accountLogin`: Your NameBright account login.
- `appName`: Your registered application name.
- `appSecret`: Your application secret key.

Obtain these from your NameBright account dashboard.

### Options

- `apiUrl`: Override the default API root (`https://api.namebright.com`).

### Debugging

Enable debug logs with the `DEBUG` environment variable:

```bash
DEBUG=NameBright node your-script.js
```

This logs HTTP requests, token fetches, and API responses.

## API Reference

### Methods

- `getAccount(): Promise<NameBrightAccountResponse>`
  - Fetches the account balance.
- `getDomains(page?: number, perPage?: number): Promise<NameBrightDomain[]>`
  - Lists domains with pagination.
- `getDomain(domain: string): Promise<NameBrightDomain>`
  - Retrieves details for a specific domain.
- `getNameservers(domain: string): Promise<string[]>`
  - Gets the nameservers for a domain.
- `deleteNameservers(domain: string): Promise<void>`
  - Deletes all nameservers for a domain.
- `deleteNameserver(domain: string, nameserver: string): Promise<void>`
  - Deletes a specific nameserver.
- `renewDomain(domain: string, years?: number): Promise<NameBrightRenewResponse>`
  - Renews a domain for 1–10 years.
- `setNameservers(domain: string, nameservers: string[]): Promise<string[]>`
  - Sets nameservers (2–4 required).
- `getClient(): AxiosInstance`
  - Returns the Axios instance for custom requests.

### Interfaces

- `AuthConfig`: `{ accountLogin: string, appName: string, appSecret: string }`
- `NameBrightAccountResponse`: `{ AccountBalance: number }`
- `NameBrightDomain`: Domain details (name, status, expiration, etc.).
- `NameBrightNameserversResponse`: `{ DomainName: string, NameServers: string[] }`
- `NameBrightRenewResponse`: Renewal order details (order ID, price, etc.).

## Error Handling

The client throws errors for:

- Missing or invalid authentication credentials.
- Invalid renewal years (1–10 required).
- Invalid nameserver count (2–4 required).
- Token acquisition failures.
- API request errors (via Axios).

Handle errors with try-catch:

```typescript
try {
  const domains = await client.getDomains();
  console.log(domains);
} catch (error) {
  console.error('Error:', error.message);
}
```
