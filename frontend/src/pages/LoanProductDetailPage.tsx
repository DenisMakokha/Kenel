import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loanProductService } from '../services/loanProductService';
import { LoanProduct, LoanProductVersion, ProductVersionStatus } from '../types/loan-product';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { formatDate } from '../lib/utils';

export default function LoanProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<LoanProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await loanProductService.getProduct(id!);
      setProduct(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ProductVersionStatus) => {
    const variants: Record<ProductVersionStatus, any> = {
      DRAFT: 'outline',
      PUBLISHED: 'success',
      RETIRED: 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getProductTypeBadge = (type: string) => {
    return <Badge variant="default">{type.replace('_', ' ')}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading product...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error || 'Product not found'}
        </div>
        <Button className="mt-4" onClick={() => navigate('/loan-products')}>
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            {product.isActive ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="destructive">Inactive</Badge>
            )}
          </div>
          <p className="text-muted-foreground">Code: {product.code}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/loan-products/${id}/edit`)}>
            Edit Product
          </Button>
          <Button onClick={() => navigate(`/loan-products/${id}/versions/new`)}>
            + New Version
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Product Type</p>
            <p className="font-medium">{getProductTypeBadge(product.productType)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Currency</p>
            <p className="font-medium">{product.currencyCode}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="font-medium">{product.description || 'No description'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="font-medium">{formatDate(product.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Updated</p>
            <p className="font-medium">{formatDate(product.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Versions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Product Versions</CardTitle>
            <Button size="sm" onClick={() => navigate(`/loan-products/${id}/versions/new`)}>
              + New Version
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!product.versions || product.versions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No versions created yet</p>
              <Button onClick={() => navigate(`/loan-products/${id}/versions/new`)}>
                Create First Version
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {product.versions.map((version: LoanProductVersion) => (
                <div
                  key={version.id}
                  className="border rounded-lg p-4 hover:bg-accent cursor-pointer"
                  onClick={() => navigate(`/loan-products/${id}/versions/${version.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">Version {version.versionNumber}</h3>
                        {getStatusBadge(version.status)}
                        {version.status === 'PUBLISHED' && (
                          <Badge variant="outline">Current</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Created: </span>
                          {formatDate(version.createdAt)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">By: </span>
                          {version.createdBy
                            ? `${version.createdBy.firstName} ${version.createdBy.lastName}`
                            : 'Unknown'}
                        </div>
                        {version.effectiveFrom && (
                          <div>
                            <span className="text-muted-foreground">Effective From: </span>
                            {formatDate(version.effectiveFrom)}
                          </div>
                        )}
                        {version.effectiveTo && (
                          <div>
                            <span className="text-muted-foreground">Effective To: </span>
                            {formatDate(version.effectiveTo)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/loan-products/${id}/versions/${version.id}`);
                        }}
                      >
                        View
                      </Button>
                      {version.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/loan-products/${id}/versions/${version.id}/edit`);
                          }}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Button */}
      <Button variant="outline" onClick={() => navigate('/loan-products')}>
        ← Back to Products
      </Button>
    </div>
  );
}
