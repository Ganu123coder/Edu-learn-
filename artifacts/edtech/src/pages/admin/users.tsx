import { useState } from "react";
import { useListUsers, useUpdateUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: users, isLoading, refetch } = useListUsers({
    search: search || undefined,
    role: roleFilter !== "all" ? (roleFilter as any) : undefined,
  });

  const updateUserMutation = useUpdateUser();

  const handleToggleBlock = async (id: number, currentBlocked: boolean) => {
    try {
      await updateUserMutation.mutateAsync({
        id,
        data: { isBlocked: !currentBlocked },
      });
      toast({
        title: "User updated",
        description: `User has been ${!currentBlocked ? "blocked" : "unblocked"}.`,
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleApprove = async (id: number, currentApproved: boolean) => {
    try {
      await updateUserMutation.mutateAsync({
        id,
        data: { isApproved: !currentApproved },
      });
      toast({
        title: "User updated",
        description: `Trainer has been ${!currentApproved ? "approved" : "unapproved"}.`,
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
        <p className="text-muted-foreground">View and manage all users on the platform.</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <CardTitle>Users</CardTitle>
            <div className="flex w-full md:w-auto gap-4">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-24 inline-block" /></TableCell>
                    </TableRow>
                  ))
                ) : users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profilePhoto || ""} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.isBlocked ? (
                            <Badge variant="destructive">Blocked</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                          )}
                          {user.role === "trainer" && (
                            user.isApproved ? (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Approved</Badge>
                            ) : (
                              <Badge variant="secondary">Pending Approval</Badge>
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {user.role === "trainer" && (
                            <Button 
                              variant={user.isApproved ? "outline" : "default"} 
                              size="sm"
                              onClick={() => handleToggleApprove(user.id, user.isApproved)}
                              disabled={updateUserMutation.isPending}
                            >
                              {user.isApproved ? "Revoke" : "Approve"}
                            </Button>
                          )}
                          <Button 
                            variant={user.isBlocked ? "outline" : "destructive"} 
                            size="sm"
                            onClick={() => handleToggleBlock(user.id, user.isBlocked)}
                            disabled={updateUserMutation.isPending || user.role === "admin"}
                          >
                            {user.isBlocked ? "Unblock" : "Block"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
