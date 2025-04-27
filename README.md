# NameBright API Client

A TypeScript client for the [NameBright REST API](https://api.namebright.com). This library provides a typed, lightweight wrapper for managing domains, nameservers, renewals, and account details, with automatic token management and debug logging.

- **API Documentation**: [https://api.namebright.com/rest/Help](https://api.namebright.com/rest/Help)
- **Examples**: [https://github.com/NameBright/DomainApiClientExamples](https://github.com/NameBright/DomainApiClientExamples)
- **API Access**: Requires authorization from NameBright, configured at [https://legacy.namebright.com/Settings#Api](https://legacy.namebright.com/Settings#Api)

## Features

- **Automatic Token Management**: Handles token fetching and caching.
- **Typed Interfaces**: Strongly-typed responses for account, domains, nameservers, and renewals.
- **Debug Logging**: Built-in logging via the `debug` package.
- **Custom Requests**: Access the underlying Axios instance for flexibility.
- **Comprehensive API**: Supports domain queries, nameserver updates, renewals, and account summaries.
- **Lazy Domain Iteration**: Async generator for efficiently iterating over all domains.

## Installation

Install the package via npm:

```bash
npm install --save namebright
```

Required dependencies:

- `axios`
- `query-string`
- `debug`

Install them with:

```bash
npm install axios query-string debug
```

For TypeScript, include type definitions:

```bash
npm install @types/debug --save-dev
```

## IP Restriction

You may encounter a `400 Usage Violation` error if your IP is not whitelisted. Configure IP whitelisting in your NameBright account at [https://legacy.namebright.com/Settings#Api](https://legacy.namebright.com/Settings#Api). Note: Using `0.0.0.0` to whitelist all IPs is not supported. Find your external IP at [ip8.com](https://ip8.com) and whitelist it.

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
const page = await client.getDomains(1, 20);
console.log('Domains:', page.Domains);
console.log('Total Results:', page.ResultsTotal);
```

#### Iterate Over All Domains

Use the async generator to lazily fetch all domains:

```typescript
for await (const domain of client.fetchDomains(20)) {
  console.log('Domain:', domain.DomainName);
}
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

Obtain these from your NameBright account dashboard at [https://legacy.namebright.com/Settings#Api](https://legacy.namebright.com/Settings#Api).

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
- `getDomains(page?: number, perPage?: number): Promise<NameBrightDomainsPage>`
  - Lists domains with pagination, returning total results, current page, and domains.
- `fetchDomains(perPage?: number): AsyncGenerator<NameBrightDomain, void, unknown>`
  - Lazily iterates over all domains in the account (max `perPage` is 20).
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
- `NameBrightDomainsPage`: `{ ResultsTotal: number, CurrentPage: number, Domains: NameBrightDomain[] }`
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
  const page = await client.getDomains();
  console.log(page.Domains);
} catch (error) {
  console.error('Error:', error.message);
}
```

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m 'Add your feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License

MIT License. See the [LICENSE](LICENSE) file.

## Support

For issues, open a ticket on the [GitHub repository](https://github.com/7c/namebright) or contact the maintainers.