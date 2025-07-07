import { supabase } from '../config/supabase';
import {
  PDFTemplate,
  TemplateContentBlock,
  CompanyBranding,
  ServiceCatalogItem,
  TemplateVariable,
  TemplateType,
  CompanyType
} from '../types/pdfTemplate';

export class PDFTemplateService {
  // Template Management
  async getTemplates(companyType: CompanyType, templateType?: TemplateType): Promise<PDFTemplate[]> {
    try {
      let query = supabase
        .from('pdf_templates')
        .select(`
          *,
          contentBlocks:template_content_blocks(*)
        `)
        .eq('company_type', companyType)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (templateType) {
        query = query.eq('template_type', templateType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapTemplate);
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  async getTemplate(templateId: string): Promise<PDFTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('pdf_templates')
        .select(`
          *,
          contentBlocks:template_content_blocks(*),
          variables:template_variables(*)
        `)
        .eq('id', templateId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.mapTemplate(data);
    } catch (error) {
      console.error('Error fetching template:', error);
      throw error;
    }
  }

  async createTemplate(template: Omit<PDFTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<PDFTemplate> {
    try {
      const { data, error } = await supabase
        .from('pdf_templates')
        .insert({
          company_type: template.companyType,
          template_type: template.templateType,
          name: template.name,
          description: template.description,
          is_active: template.isActive,
          page_settings: template.pageSettings,
          created_by: template.createdBy
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapTemplate(data);
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async updateTemplate(templateId: string, updates: Partial<PDFTemplate>): Promise<PDFTemplate> {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.pageSettings !== undefined) updateData.page_settings = updates.pageSettings;

      const { data, error } = await supabase
        .from('pdf_templates')
        .update(updateData)
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;

      return this.mapTemplate(data);
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('pdf_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  async duplicateTemplate(templateId: string, newName: string): Promise<PDFTemplate> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) throw new Error('Template not found');

      const newTemplate = await this.createTemplate({
        ...template,
        name: newName,
        isActive: false
      });

      // Duplicate content blocks
      if (template.contentBlocks) {
        for (const block of template.contentBlocks) {
          await this.createContentBlock({
            ...block,
            templateId: newTemplate.id
          });
        }
      }

      return newTemplate;
    } catch (error) {
      console.error('Error duplicating template:', error);
      throw error;
    }
  }

  // Content Block Management
  async getContentBlocks(templateId: string): Promise<TemplateContentBlock[]> {
    try {
      const { data, error } = await supabase
        .from('template_content_blocks')
        .select('*')
        .eq('template_id', templateId)
        .order('page_number', { ascending: true })
        .order('position', { ascending: true });

      if (error) throw error;

      return (data || []).map(this.mapContentBlock);
    } catch (error) {
      console.error('Error fetching content blocks:', error);
      throw error;
    }
  }

  async createContentBlock(block: Omit<TemplateContentBlock, 'id' | 'createdAt' | 'updatedAt'>): Promise<TemplateContentBlock> {
    try {
      const { data, error } = await supabase
        .from('template_content_blocks')
        .insert({
          template_id: block.templateId,
          block_type: block.blockType,
          name: block.name,
          position: block.position,
          page_number: block.pageNumber,
          x_position: block.xPosition,
          y_position: block.yPosition,
          width: block.width,
          height: block.height,
          settings: block.settings,
          content: block.content,
          is_visible: block.isVisible
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapContentBlock(data);
    } catch (error) {
      console.error('Error creating content block:', error);
      throw error;
    }
  }

  async updateContentBlock(blockId: string, updates: Partial<TemplateContentBlock>): Promise<TemplateContentBlock> {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.position !== undefined) updateData.position = updates.position;
      if (updates.pageNumber !== undefined) updateData.page_number = updates.pageNumber;
      if (updates.xPosition !== undefined) updateData.x_position = updates.xPosition;
      if (updates.yPosition !== undefined) updateData.y_position = updates.yPosition;
      if (updates.width !== undefined) updateData.width = updates.width;
      if (updates.height !== undefined) updateData.height = updates.height;
      if (updates.settings !== undefined) updateData.settings = updates.settings;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.isVisible !== undefined) updateData.is_visible = updates.isVisible;

      const { data, error } = await supabase
        .from('template_content_blocks')
        .update(updateData)
        .eq('id', blockId)
        .select()
        .single();

      if (error) throw error;

      return this.mapContentBlock(data);
    } catch (error) {
      console.error('Error updating content block:', error);
      throw error;
    }
  }

  async deleteContentBlock(blockId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('template_content_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting content block:', error);
      throw error;
    }
  }

  async reorderContentBlocks(templateId: string, blockOrders: { id: string; position: number }[]): Promise<void> {
    try {
      const updates = blockOrders.map(({ id, position }) => 
        supabase
          .from('template_content_blocks')
          .update({ position })
          .eq('id', id)
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Error reordering content blocks:', error);
      throw error;
    }
  }

  // Company Branding
  async getBranding(companyType: CompanyType): Promise<CompanyBranding | null> {
    try {
      const { data, error } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_type', companyType)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      return this.mapBranding(data);
    } catch (error) {
      console.error('Error fetching branding:', error);
      throw error;
    }
  }

  async updateBranding(companyType: CompanyType, branding: Partial<CompanyBranding>): Promise<CompanyBranding> {
    try {
      // First check if branding exists
      const { data: existingBranding } = await supabase
        .from('company_branding')
        .select('id')
        .eq('company_type', companyType)
        .single();

      const updateData: any = {};
      
      if (branding.logoUrl !== undefined) updateData.logo_url = branding.logoUrl;
      if (branding.letterheadUrl !== undefined) updateData.letterhead_url = branding.letterheadUrl;
      if (branding.primaryColor !== undefined) updateData.primary_color = branding.primaryColor;
      if (branding.secondaryColor !== undefined) updateData.secondary_color = branding.secondaryColor;
      if (branding.accentColor !== undefined) updateData.accent_color = branding.accentColor;
      if (branding.fontFamily !== undefined) updateData.font_family = branding.fontFamily;
      if (branding.headerSettings !== undefined) updateData.header_settings = branding.headerSettings;
      if (branding.footerSettings !== undefined) updateData.footer_settings = branding.footerSettings;

      let result;
      if (existingBranding) {
        // Update existing branding
        const { data, error } = await supabase
          .from('company_branding')
          .update(updateData)
          .eq('company_type', companyType)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Create new branding
        const { data, error } = await supabase
          .from('company_branding')
          .insert({
            company_type: companyType,
            ...updateData
          })
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      return this.mapBranding(result);
    } catch (error) {
      console.error('Error updating branding:', error);
      throw error;
    }
  }

  // Service Catalog
  async getServices(companyType: CompanyType, category?: string): Promise<ServiceCatalogItem[]> {
    try {
      let query = supabase
        .from('service_catalog')
        .select('*')
        .eq('company_type', companyType)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('service_name', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapService);
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  async createService(service: Omit<ServiceCatalogItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceCatalogItem> {
    try {
      const { data, error } = await supabase
        .from('service_catalog')
        .insert({
          company_type: service.companyType,
          service_code: service.serviceCode,
          service_name: service.serviceName,
          description: service.description,
          unit: service.unit,
          base_price: service.basePrice,
          category: service.category,
          is_active: service.isActive,
          settings: service.settings
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapService(data);
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  async updateService(serviceId: string, updates: Partial<ServiceCatalogItem>): Promise<ServiceCatalogItem> {
    try {
      const updateData: any = {};
      if (updates.serviceName !== undefined) updateData.service_name = updates.serviceName;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.unit !== undefined) updateData.unit = updates.unit;
      if (updates.basePrice !== undefined) updateData.base_price = updates.basePrice;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.settings !== undefined) updateData.settings = updates.settings;

      const { data, error } = await supabase
        .from('service_catalog')
        .update(updateData)
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;

      return this.mapService(data);
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  async deleteService(serviceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('service_catalog')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }

  // Template Variables
  async getTemplateVariables(templateId: string): Promise<TemplateVariable[]> {
    try {
      const { data, error } = await supabase
        .from('template_variables')
        .select('*')
        .eq('template_id', templateId)
        .order('variable_name', { ascending: true });

      if (error) throw error;

      return (data || []).map(this.mapVariable);
    } catch (error) {
      console.error('Error fetching template variables:', error);
      throw error;
    }
  }

  async createTemplateVariable(variable: Omit<TemplateVariable, 'id' | 'createdAt'>): Promise<TemplateVariable> {
    try {
      const { data, error } = await supabase
        .from('template_variables')
        .insert({
          template_id: variable.templateId,
          variable_name: variable.variableName,
          variable_type: variable.variableType,
          default_value: variable.defaultValue,
          is_required: variable.isRequired,
          validation_rules: variable.validationRules
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapVariable(data);
    } catch (error) {
      console.error('Error creating template variable:', error);
      throw error;
    }
  }

  // Helper methods for mapping database records
  private mapTemplate(data: any): PDFTemplate {
    return {
      id: data.id,
      companyType: data.company_type as CompanyType,
      templateType: data.template_type,
      name: data.name,
      description: data.description,
      isActive: data.is_active,
      pageSettings: data.page_settings,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by,
      contentBlocks: data.contentBlocks?.map((block: any) => this.mapContentBlock(block))
    };
  }

  private mapContentBlock(data: any): TemplateContentBlock {
    return {
      id: data.id,
      templateId: data.template_id,
      blockType: data.block_type,
      name: data.name,
      position: data.position,
      pageNumber: data.page_number,
      xPosition: data.x_position,
      yPosition: data.y_position,
      width: data.width,
      height: data.height,
      settings: data.settings || {},
      content: data.content || {},
      isVisible: data.is_visible,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapBranding(data: any): CompanyBranding {
    return {
      id: data.id,
      companyType: data.company_type as CompanyType,
      logoUrl: data.logo_url,
      letterheadUrl: data.letterhead_url,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color,
      accentColor: data.accent_color,
      fontFamily: data.font_family,
      headerSettings: data.header_settings,
      footerSettings: data.footer_settings,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapService(data: any): ServiceCatalogItem {
    return {
      id: data.id,
      companyType: data.company_type as CompanyType,
      serviceCode: data.service_code,
      serviceName: data.service_name,
      description: data.description,
      unit: data.unit,
      basePrice: data.base_price,
      category: data.category,
      isActive: data.is_active,
      settings: data.settings,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapVariable(data: any): TemplateVariable {
    return {
      id: data.id,
      templateId: data.template_id,
      variableName: data.variable_name,
      variableType: data.variable_type,
      defaultValue: data.default_value,
      isRequired: data.is_required,
      validationRules: data.validation_rules,
      createdAt: new Date(data.created_at)
    };
  }
}

export const pdfTemplateService = new PDFTemplateService();