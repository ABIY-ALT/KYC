"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { type DateRange } from "react-day-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auditLogs as initialAuditLogs, users as allUsers, AuditLog } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Calendar as CalendarIcon, History, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const uniqueActions = [...new Set(initialAuditLogs.map(log => log.action))];
const placeholderAvatars = PlaceHolderImages.filter(img => img.id.includes('user-avatar'));

const getAvatarUrl = (avatarId: string) => {
    const avatar = placeholderAvatars.find(a => a.id === avatarId);
    // Fallback for avatars not in placeholder list
    return avatar ? avatar.imageUrl : `https://avatar.vercel.sh/${avatarId}`;
}

const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('create') || lowerAction.includes('update')) {
        return 'default';
    }
    if (lowerAction.includes('deactivate') || lowerAction.includes('escalate') || lowerAction.includes('reject')) {
        return 'destructive';
    }
    if (lowerAction.includes('request')) {
        return 'outline';
    }
    return 'secondary';
};

export default function AuditLogsPage() {
    const { toast } = useToast();
    const [date, setDate] = useState<DateRange | undefined>(undefined);
    const [filters, setFilters] = useState({
        userId: 'all',
        action: 'all',
        searchTerm: '',
    });
    const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>(initialAuditLogs);

    const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const handleApplyFilters = () => {
        let logs = initialAuditLogs;

        if (date?.from) {
            const toDate = date.to ? new Date(date.to) : new Date(date.from);
            toDate.setHours(23, 59, 59, 999);
            logs = logs.filter(log => {
                const logDate = new Date(log.timestamp);
                return logDate >= date.from! && logDate <= toDate;
            });
        }

        if (filters.userId !== 'all') {
            logs = logs.filter(log => log.userId === filters.userId);
        }

        if (filters.action !== 'all') {
            logs = logs.filter(log => log.action === filters.action);
        }

        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            logs = logs.filter(log => 
                log.userName.toLowerCase().includes(term) ||
                log.action.toLowerCase().includes(term) ||
                log.entityType.toLowerCase().includes(term) ||
                log.entityId.toLowerCase().includes(term) ||
                log.details.toLowerCase().includes(term)
            );
        }

        setFilteredLogs(logs);
        toast({
            title: "Filters Applied",
            description: `Found ${logs.length} log entries.`,
        });
    };

    const handleResetFilters = () => {
        setFilters({ userId: 'all', action: 'all', searchTerm: '' });
        setDate(undefined);
        setFilteredLogs(initialAuditLogs);
        toast({ title: "Filters Reset" });
    }

    return (
        <div className="space-y-6">
            <Card className="hover-lift">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History /> Audit Logs
                    </CardTitle>
                    <CardDescription>
                        A read-only log of all system and user activities. Use the filters to narrow down your search.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="grid gap-2">
                            <Label htmlFor="date-range">Date Range</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button id="date-range" variant={"outline"} className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (date.to ? `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}` : format(date.from, "LLL dd, y")) : <span>Pick a date range</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="user-filter">User</Label>
                            <Select value={filters.userId} onValueChange={v => handleFilterChange('userId', v)}>
                                <SelectTrigger id="user-filter"><SelectValue placeholder="Select User" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    {allUsers.map(user => <SelectItem key={user.id} value={user.id}>{user.firstName} {user.lastName}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="action-filter">Action</Label>
                            <Select value={filters.action} onValueChange={v => handleFilterChange('action', v)}>
                                <SelectTrigger id="action-filter"><SelectValue placeholder="Select Action" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    {uniqueActions.map(action => <SelectItem key={action} value={action}>{action}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="search-filter">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search-filter"
                                    type="search"
                                    placeholder="Search details, IDs..."
                                    className="pl-8"
                                    value={filters.searchTerm}
                                    onChange={e => handleFilterChange('searchTerm', e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleResetFilters}>Reset</Button>
                        <Button onClick={handleApplyFilters}>Apply Filters</Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="hover-lift">
                <CardHeader>
                    <CardTitle>Log Entries</CardTitle>
                    <CardDescription>Displaying {filteredLogs.length} of {initialAuditLogs.length} total entries.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead className="hidden md:table-cell">Entity</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead className="hidden sm:table-cell text-right">Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map(log => (
                                    <TableRow key={log.id} className="hover-lift">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={getAvatarUrl(log.userAvatar)} alt={log.userName} data-ai-hint="person portrait" />
                                                    <AvatarFallback>{log.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{log.userName}</p>
                                                    <p className="text-sm text-muted-foreground hidden lg:block">{log.userId}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getActionBadgeVariant(log.action)}>{log.action}</Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="font-medium">{log.entityType}</div>
                                            <div className="text-xs text-muted-foreground font-mono">{log.entityId}</div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground max-w-[200px] sm:max-w-xs truncate">{log.details}</TableCell>
                                        <TableCell className="hidden sm:table-cell text-right">
                                            <div className="text-sm text-muted-foreground" title={format(new Date(log.timestamp), "PPP p")}>
                                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No log entries found for the selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
