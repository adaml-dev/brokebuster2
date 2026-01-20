import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, BarChart3, DollarSign, TrendingUp, Users, Activity } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Premium Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
                Settings
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                New Project
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Alert */}
        <Alert className="mb-6 border-blue-900/50 bg-blue-950/20">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertTitle className="text-blue-300">Welcome to your Premium Dashboard</AlertTitle>
          <AlertDescription className="text-blue-200/70">
            This is a modern Next.js 14 app with Shadcn UI in premium dark mode.
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">$45,231.89</div>
              <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +20.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">+2,350</div>
              <p className="text-xs text-blue-500 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +180.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Conversions</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">+12,234</div>
              <p className="text-xs text-purple-500 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +19% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Growth Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">+573</div>
              <p className="text-xs text-orange-500 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +201% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-800">
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-800">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-gray-800">
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Table Card */}
              <Card className="border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950">
                <CardHeader>
                  <CardTitle className="text-white">Recent Transactions</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your latest financial activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="font-medium text-white">Success</TableCell>
                        <TableCell className="text-green-500">+$1,999.00</TableCell>
                      </TableRow>
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="font-medium text-white">Pending</TableCell>
                        <TableCell className="text-yellow-500">+$39.00</TableCell>
                      </TableRow>
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="font-medium text-white">Success</TableCell>
                        <TableCell className="text-green-500">+$299.00</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Form Card */}
              <Card className="border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                  <CardDescription className="text-gray-400">
                    Perform quick operations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Enter your name" 
                      className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="Enter your email" 
                      className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                    />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Submit
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950">
              <CardHeader>
                <CardTitle className="text-white">Analytics Overview</CardTitle>
                <CardDescription className="text-gray-400">
                  Detailed analytics and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Analytics content goes here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950">
              <CardHeader>
                <CardTitle className="text-white">Reports</CardTitle>
                <CardDescription className="text-gray-400">
                  Generate and view reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Reports content goes here...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
