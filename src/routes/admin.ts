import { addCorsHeaders } from "../utils/cors.ts";
import { getAllLogs } from "../services/query-logger.ts";
import { getAllCosts } from "../services/cost-tracker.ts";

function checkPassword(password: string | null): boolean {
  const testApiKey = Bun.env.TEST_API_KEY;
  return testApiKey !== undefined && password === testApiKey;
}

function getLoginPage(): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Access</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f7fa;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 2rem;
        }
        .login-container {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
        }
        h1 {
            font-size: 1.5rem;
            color: #1a202c;
            margin-bottom: 0.5rem;
        }
        p {
            color: #718096;
            margin-bottom: 1.5rem;
            font-size: 0.875rem;
        }
        .form-group {
            margin-bottom: 1.5rem;
        }
        label {
            display: block;
            font-size: 0.875rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.5rem;
        }
        input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            font-size: 1rem;
            transition: border-color 0.2s;
        }
        input:focus {
            outline: none;
            border-color: #2563eb;
        }
        button {
            width: 100%;
            padding: 0.75rem;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        button:hover {
            background: #1d4ed8;
        }
        .error {
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h1>🔒 Admin Access</h1>
        <p>Please enter the password to access the admin dashboard.</p>
        <form method="POST" action="/admin">
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required autofocus>
            </div>
            <button type="submit">Access Dashboard</button>
        </form>
    </div>
</body>
</html>`;

  const headers = addCorsHeaders(
    new Headers({
      "Content-Type": "text/html",
    })
  );

  return new Response(html, { headers, status: 200 });
}

export async function handleAdminUI(req: Request): Promise<Response> {
  // Handle POST (login form submission)
  if (req.method === "POST") {
    try {
      const formData = await req.formData();
      const password = formData.get("password")?.toString() || null;

      if (!checkPassword(password)) {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Access - Invalid Password</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f7fa;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 2rem;
        }
        .login-container {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
        }
        .error {
            background: #fee2e2;
            color: #991b1b;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            font-size: 0.875rem;
        }
        h1 { font-size: 1.5rem; color: #1a202c; margin-bottom: 0.5rem; }
        p { color: #718096; margin-bottom: 1.5rem; font-size: 0.875rem; }
        .form-group { margin-bottom: 1.5rem; }
        label { display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
        input { width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 1rem; }
        input:focus { outline: none; border-color: #2563eb; }
        button { width: 100%; padding: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; }
        button:hover { background: #1d4ed8; }
    </style>
</head>
<body>
    <div class="login-container">
        <h1>🔒 Admin Access</h1>
        <div class="error">Invalid password. Please try again.</div>
        <p>Please enter the password to access the admin dashboard.</p>
        <form method="POST" action="/admin">
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required autofocus>
            </div>
            <button type="submit">Access Dashboard</button>
        </form>
    </div>
</body>
</html>`;

        const headers = addCorsHeaders(
          new Headers({
            "Content-Type": "text/html",
          })
        );
        return new Response(html, { headers, status: 401 });
      }

      // Password correct - set session cookie and redirect
      const sessionToken = Buffer.from(`admin_${Date.now()}`).toString("base64");
      const headers = new Headers();
      headers.set("Set-Cookie", `admin_session=${sessionToken}; HttpOnly; Path=/admin; Max-Age=3600; SameSite=Lax`);
      headers.set("Location", "/admin");
      return new Response(null, { headers, status: 302 });
    } catch (error) {
      // If form parsing fails, show login page
      return getLoginPage();
    }
  }

  // Handle GET - check for session cookie
  const cookies = req.headers.get("Cookie");
  const hasSession = cookies?.includes("admin_session=");

  if (!hasSession) {
    return getLoginPage();
  }

  // User is authenticated, show dashboard
  const logs = await getAllLogs();
  const costs = await getAllCosts();

  // Calculate stats
  const totalQueries = logs.reduce((sum, log) => sum + log.queries.length, 0);
  const totalCost = costs.reduce((sum, cost) => sum + cost.totalCost, 0);
  const prodQueries = logs.reduce(
    (sum, log) => sum + log.queries.filter((q) => q.apiKey === "prod").length,
    0
  );
  const testQueries = logs.reduce(
    (sum, log) => sum + log.queries.filter((q) => q.apiKey === "test").length,
    0
  );

  // Prepare data for charts
  const monthlyQueryData = logs.map((log) => ({
    month: log.month,
    total: log.queries.length,
    prod: log.queries.filter((q) => q.apiKey === "prod").length,
    test: log.queries.filter((q) => q.apiKey === "test").length,
  }));

  const monthlyCostData = costs.map((cost) => ({
    month: cost.month,
    cost: cost.totalCost,
    invocations: cost.totalInvocations,
  }));

  // Get recent queries (last 50)
  const allQueries = logs.flatMap((log) =>
    log.queries.map((q) => ({ ...q, month: log.month }))
  );
  allQueries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const recentQueries = allQueries.slice(0, 50);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Tax Calculator API</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f7fa;
            color: #1a202c;
            line-height: 1.6;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }
        header {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        h1 {
            font-size: 2rem;
            color: #2563eb;
            margin-bottom: 0.5rem;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stat-card h3 {
            font-size: 0.875rem;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
        }
        .stat-card .value {
            font-size: 2rem;
            font-weight: 700;
            color: #1a202c;
        }
        .stat-card .value.primary { color: #2563eb; }
        .stat-card .value.success { color: #10b981; }
        .stat-card .value.warning { color: #f59e0b; }
        .stat-card .value.danger { color: #ef4444; }
        .chart-container {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        .chart-container h2 {
            font-size: 1.25rem;
            margin-bottom: 1rem;
            color: #1a202c;
        }
        .queries-table {
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .queries-table h2 {
            padding: 1.5rem;
            font-size: 1.25rem;
            border-bottom: 1px solid #e5e7eb;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        thead {
            background: #f9fafb;
        }
        th {
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            color: #374151;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        td {
            padding: 1rem;
            border-top: 1px solid #e5e7eb;
            font-size: 0.875rem;
        }
        .badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .badge.prod {
            background: #dbeafe;
            color: #1e40af;
        }
        .badge.test {
            background: #fef3c7;
            color: #92400e;
        }
        .badge.success {
            background: #d1fae5;
            color: #065f46;
        }
        .badge.error {
            background: #fee2e2;
            color: #991b1b;
        }
        .query-url {
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.75rem;
            background: #f3f4f6;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            word-break: break-all;
        }
        .month-selector {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
            flex-wrap: wrap;
        }
        .month-btn {
            padding: 0.5rem 1rem;
            border: 1px solid #e5e7eb;
            background: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.875rem;
            transition: all 0.2s;
        }
        .month-btn:hover {
            background: #f9fafb;
        }
        .month-btn.active {
            background: #2563eb;
            color: white;
            border-color: #2563eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📊 Admin Dashboard</h1>
            <p>Tax Calculator API - Analytics & Monitoring</p>
        </header>

        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Queries</h3>
                <div class="value primary">${totalQueries.toLocaleString()}</div>
            </div>
            <div class="stat-card">
                <h3>Production Queries</h3>
                <div class="value success">${prodQueries.toLocaleString()}</div>
            </div>
            <div class="stat-card">
                <h3>Test Queries</h3>
                <div class="value warning">${testQueries.toLocaleString()}</div>
            </div>
            <div class="stat-card">
                <h3>Total Cost</h3>
                <div class="value danger">₹${totalCost.toFixed(2)}</div>
            </div>
        </div>

        <div class="chart-container">
            <h2>Queries Over Time</h2>
            <canvas id="queriesChart" height="80"></canvas>
        </div>

        <div class="chart-container">
            <h2>Monthly Costs</h2>
            <canvas id="costsChart" height="80"></canvas>
        </div>

        <div class="queries-table">
            <h2>Recent Queries (Last 50)</h2>
            <table>
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>API Key</th>
                        <th>Query</th>
                        <th>Status</th>
                        <th>Response</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentQueries
                      .map(
                        (q) => `
                    <tr>
                        <td>${new Date(q.timestamp).toLocaleString()}</td>
                        <td><span class="badge ${q.apiKey}">${q.apiKey.toUpperCase()}</span></td>
                        <td><span class="query-url">?${new URLSearchParams(
                          Object.entries(q.query).filter(([_, v]) => v)
                        ).toString()}</span></td>
                        <td><span class="badge ${
                          q.statusCode === 200 ? "success" : "error"
                        }">${q.statusCode}</span></td>
                        <td>${
                          q.statusCode === 200
                            ? `Rate: ${(q.response as any).rate?.combined_rate || "N/A"}`
                            : `<span style="color: #ef4444;">${(q.response as any).error || "Error"}</span>`
                        }</td>
                    </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
    </div>

    <script>
        // Queries Chart
        const queriesCtx = document.getElementById('queriesChart').getContext('2d');
        new Chart(queriesCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(monthlyQueryData.map((d) => d.month))},
                datasets: [
                    {
                        label: 'Total Queries',
                        data: ${JSON.stringify(monthlyQueryData.map((d) => d.total))},
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        tension: 0.4,
                    },
                    {
                        label: 'Production',
                        data: ${JSON.stringify(monthlyQueryData.map((d) => d.prod))},
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                    },
                    {
                        label: 'Test',
                        data: ${JSON.stringify(monthlyQueryData.map((d) => d.test))},
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                        },
                    },
                },
            },
        });

        // Costs Chart
        const costsCtx = document.getElementById('costsChart').getContext('2d');
        new Chart(costsCtx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(monthlyCostData.map((d) => d.month))},
                datasets: [
                    {
                        label: 'Total Cost (₹)',
                        data: ${JSON.stringify(monthlyCostData.map((d) => d.cost))},
                        backgroundColor: '#ef4444',
                        borderRadius: 6,
                    },
                    {
                        label: 'Invocations',
                        data: ${JSON.stringify(monthlyCostData.map((d) => d.invocations))},
                        backgroundColor: '#2563eb',
                        borderRadius: 6,
                        yAxisID: 'y1',
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Cost (₹)',
                        },
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Invocations',
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    },
                },
            },
        });
    </script>
</body>
</html>`;

  const headers = addCorsHeaders(
    new Headers({
      "Content-Type": "text/html",
    })
  );

  return new Response(html, {
    headers,
    status: 200,
  });
}
