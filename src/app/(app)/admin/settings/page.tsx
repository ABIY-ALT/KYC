"use client";

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2 } from 'lucide-react';

// Mock data for settings
const initialRoles = [
  { id: 'admin', name: 'Admin', permissions: ['manage_users', 'manage_settings', 'view_reports', 'override_decisions'] },
  { id: 'supervisor', name: 'Supervisor', permissions: ['view_reports', 'override_decisions', 'review_escalations'] },
  { id: 'officer', name: 'Officer', permissions: ['review_submissions'] },
  { id: 'branch_manager', name: 'Branch Manager', permissions: ['view_branch_reports'] },
];

const allPermissions = [
  { id: 'manage_users', label: 'Manage Users' },
  { id: 'manage_settings', label: 'Manage System Settings' },
  { id: 'view_reports', label: 'View All Reports' },
  { id: 'view_branch_reports', label: 'View Branch Reports' },
  { id: 'override_decisions', label: 'Override Decisions' },
  { id: 'review_escalations', label: 'Review Escalations' },
  { id: 'review_submissions', label: 'Review Submissions' },
];


const initialDocumentTypes = ['Passport', 'Driver\'s License', 'National ID', 'Utility Bill', 'Other'];

export default function SystemSettingsPage() {
  const { toast } = useToast();
  
  // State for SLA thresholds
  const [sla, setSla] = useState({ review: 24, approval: 48 });
  
  // State for workflow rules
  const [workflowRules, setWorkflowRules] = useState({
    autoAssign: true,
    requireTwoApprovers: false,
  });

  // State for document types
  const [documentTypes, setDocumentTypes] = useState(initialDocumentTypes);
  const [newDocType, setNewDocType] = useState('');
  
  // State for roles
  const [roles, setRoles] = useState(initialRoles);

  const handleSave = (section: string) => {
    // In a real app, this would save to a backend.
    toast({
      title: 'Settings Saved',
      description: `The ${section} settings have been successfully updated.`,
    });
  };
  
  const handleAddDocType = () => {
    if (newDocType && !documentTypes.includes(newDocType)) {
      setDocumentTypes([...documentTypes, newDocType]);
      setNewDocType('');
      toast({ title: 'Document Type Added' });
    }
  };

  const handleRemoveDocType = (docType: string) => {
    setDocumentTypes(documentTypes.filter(dt => dt !== docType));
    toast({ title: 'Document Type Removed' });
  };
  
  const handlePermissionChange = (roleId: string, permissionId: string, checked: boolean) => {
    setRoles(roles.map(role => {
      if (role.id === roleId) {
        const newPermissions = checked
          ? [...role.permissions, permissionId]
          : role.permissions.filter(p => p !== permissionId);
        return { ...role, permissions: newPermissions };
      }
      return role;
    }));
  };

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>
                Manage system-wide settings, roles, and workflow configurations.
                Access is restricted to administrators.
            </CardDescription>
        </CardHeader>
      </Card>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure Service Level Agreement (SLA) thresholds for the KYC process.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="review-sla">Review SLA (hours)</Label>
                <Input 
                  id="review-sla" 
                  type="number" 
                  value={sla.review}
                  onChange={(e) => setSla(prev => ({...prev, review: parseInt(e.target.value)}))}
                  className="w-full md:w-1/3"
                />
                <p className="text-sm text-muted-foreground">
                    Time allocated for an officer to complete the initial review.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="approval-sla">Approval SLA (hours)</Label>
                <Input 
                  id="approval-sla" 
                  type="number" 
                  value={sla.approval}
                  onChange={(e) => setSla(prev => ({...prev, approval: parseInt(e.target.value)}))}
                  className="w-full md:w-1/3"
                />
                <p className="text-sm text-muted-foreground">
                    Time allocated for a supervisor to give final approval after review.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave('General')}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>
                Define what users in different roles can see and do.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    {allPermissions.map(p => <TableHead key={p.id} className="text-center hidden lg:table-cell">{p.label}</TableHead>)}
                    <TableHead className="lg:hidden">Permissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map(role => (
                    <TableRow key={role.id}>
                      <TableCell className="font-semibold">{role.name}</TableCell>
                      {allPermissions.map(p => (
                        <TableCell key={p.id} className="text-center hidden lg:table-cell">
                          <Checkbox 
                            checked={role.permissions.includes(p.id)}
                            onCheckedChange={(checked) => handlePermissionChange(role.id, p.id, !!checked)}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="lg:hidden">
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="View Permissions" />
                            </SelectTrigger>
                            <SelectContent>
                                {allPermissions.map(p => (
                                    <div key={`${role.id}-${p.id}`} className="flex items-center gap-2 p-2">
                                        <Checkbox 
                                            id={`${role.id}-${p.id}-mobile`}
                                            checked={role.permissions.includes(p.id)}
                                            onCheckedChange={(checked) => handlePermissionChange(role.id, p.id, !!checked)}
                                        />
                                        <Label htmlFor={`${role.id}-${p.id}-mobile`}>{p.label}</Label>
                                    </div>
                                ))}
                            </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave('Roles & Permissions')}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="workflow">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Rules</CardTitle>
              <CardDescription>
                Adjust rules that govern the submission and review process.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-assign" className="text-base">Auto-Assign New Submissions</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically assign new submissions to available officers based on workload.
                  </p>
                </div>
                <Switch 
                  id="auto-assign"
                  checked={workflowRules.autoAssign}
                  onCheckedChange={(checked) => setWorkflowRules(prev => ({...prev, autoAssign: checked}))}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="two-approvers" className="text-base">Require Two Approvers for Escalations</Label>
                   <p className="text-sm text-muted-foreground">
                    Escalated cases must be approved by two separate supervisors before resolution.
                  </p>
                </div>
                <Switch 
                    id="two-approvers"
                    checked={workflowRules.requireTwoApprovers}
                    onCheckedChange={(checked) => setWorkflowRules(prev => ({...prev, requireTwoApprovers: checked}))}
                />
              </div>
            </CardContent>
             <CardFooter>
              <Button onClick={() => handleSave('Workflow')}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Document Types</CardTitle>
              <CardDescription>
                Manage the list of acceptable document types for KYC submissions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input 
                        placeholder="Add new document type" 
                        value={newDocType}
                        onChange={(e) => setNewDocType(e.target.value)}
                    />
                    <Button onClick={handleAddDocType}>
                        <PlusCircle className="mr-2" /> Add
                    </Button>
                </div>
                 <div className="rounded-md border">
                    <Table>
                        <TableBody>
                            {documentTypes.map(docType => (
                                <TableRow key={docType}>
                                    <TableCell>{docType}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveDocType(docType)}>
                                            <Trash2 className="text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 </div>
            </CardContent>
             <CardFooter>
              <Button onClick={() => handleSave('Document Types')}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
