"""Bind matched PNG PBR channels in Blender; keep albedo unlit."""
import bpy
def bind_pbr(material,folder,prefix):
 nodes=material.node_tree.nodes;links=material.node_tree.links;p=nodes.get('Principled BSDF')
 def image(channel):
  node=nodes.new('ShaderNodeTexImage');node.image=bpy.data.images.load(str(folder/(prefix+'-'+channel+'.png')),check_existing=True)
  if channel!='baseColor':node.image.colorspace_settings.name='Non-Color'
  return node
 color=image('baseColor');links.new(color.outputs['Color'],p.inputs['Base Color'])
 normal=image('normal');n=nodes.new('ShaderNodeNormalMap');links.new(normal.outputs['Color'],n.inputs['Color']);links.new(n.outputs['Normal'],p.inputs['Normal'])
 orm=image('ORM');sep=nodes.new('ShaderNodeSeparateColor');links.new(orm.outputs['Color'],sep.inputs['Color']);links.new(sep.outputs['Green'],p.inputs['Roughness']);links.new(sep.outputs['Blue'],p.inputs['Metallic'])
 material['PBRSourcePrefix']=prefix;material['PBRSourceFolder']=str(folder)
