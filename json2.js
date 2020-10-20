function jsonToPojo() {
	var instance = {};
	
	function marray(obj) {
		var result = {};
	
		for (var i = 0; i < obj.length; i++) {
			for (var field in obj[i]) {
				if (!result.hasOwnProperty(field)) {
					result[field] = obj[i][field];
				}
			}
		}
	
		return result;
	}

	function tocapital(str) {
		return str[0].toUpperCase() + str.slice(1);
	}

	function identifying(type) {
		switch(type) {
			case 'array': 
				return 'List';
			case 'object': 			
			case 'string': 
			case 'number':
				return tocapital(type);
			default: 
				return type;
		}
	}

	function getType(val) {
		var typeInfo = {
			'type': typeof val
		};
	
		switch(typeInfo.type) {
			case 'object':

				if (Array.isArray(val)) {			
					typeInfo.type = 'array';
				
					if (typeof val[0] === 'object') {
						typeInfo.definition = getType(marray(val));						
					} else {
						typeInfo.definition = getType(val[0]);
					}
				} else {
					typeInfo.definition = objdef(val);
				}
		
				break;		
			case 'string':
				if (/(\d{2}|\d{4})[\-\\\/]\d{1,2}[\-\\\/]\d{1,2}/.test(val)) {
					typeInfo.type = 'date';
				}
		
				break;		
			case 'number':
				if (Number.isInteger(val)) {
					typeInfo.type = 'int';
				} else {
					typeInfo.type = 'double';
				}
		
				break;
		}

		return typeInfo;
	}

	function objdef(obj) {
		var objectDefinition = {};
		for (field in obj) {
			objectDefinition[field] = getType(obj[field]);
		}
	
		return objectDefinition;
	}

	function javaclassdef(className, fields) {
		var result = 'import java.util.*;';
		result+='\n\n'
	
		result += 'public class ' + className + ' {\n\n';		
	
		// output list of private fields
		for (var i = 0; i < fields.length; i++) {
			result += '    private ' + fields[i].typeDeclaration + ' ' + fields[i].fieldName + ';\n';
		}
	
		result += '\n\n';
	//	result += '    }\n\n\n';
	
		// output public getters
		for (var i = 0; i < fields.length; i++) {
			var javaGetterName = ( fields[i].typeDeclaration === 'Boolean' ? 'is' :'get' ) + tocapital(fields[i].fieldName);
			result += '    ' + 'public ' + fields[i].typeDeclaration + ' ' + javaGetterName + '() {\n        return ' + fields[i].fieldName + ';\n    }\n' + (i === fields.length - 1 ? '' : '\n');
			result += '    ' + 'public void set' + tocapital(fields[i].fieldName) + '(' + fields[i].typeDeclaration + ' ' + fields[i].fieldName + ') {\n        this.' + fields[i].fieldName + ' = ' + fields[i].fieldName + ';\n    }\n' + (i === fields.length - 1 ? '' : '\n');
		}

		//result += '\n\n\n\n';
		result += '}\n\n\n';
	
		return result;
	}

	instance.convert = function(json) {
		try {
			var objectDefinition = objdef( JSON.parse(json) );	
		} catch(ex) {
			return ex;
		}
	
		var classQueue = [ 
			{
				'name': 'Converted',
				'definition': objectDefinition
			} 
		];

		var result = '';			
	
		while(classQueue.length > 0) {
			var fields = [];
			var cls = classQueue.shift();		

			for (var field in cls.definition) {
				var type = cls.definition[field].type;
				var arrayType = '';
				var objType = undefined;
			
				if (type === 'array') {
					if (cls.definition[field].definition.type === 'object') {
						classQueue.push({
							'name': tocapital(field) + 'ItemType',
							'definition': cls.definition[field].definition.definition
						});
						arrayType = '<' + tocapital(field) + 'ItemType>'
					} else {
						arrayType = '<' + tocapital(cls.definition[field].definition.type) + '>';
					}
				}
			
				if (type === 'object') {
					objType = tocapital(field) + 'Type';
					classQueue.push({
						'name': objType,
						'definition': cls.definition[field].definition
					});
				}
			
				var typeDeclaration = objType ? objType : identifying(type) + arrayType;						

				fields.push({
					'fieldName': field,
					'typeDeclaration': typeDeclaration
				});			
			}

			result += javaclassdef(cls.name, fields);		

		}
		
		document.getElementById("down").addEventListener("click", myfunction);

function myfunction() {


			//var json_string=JSON.stringify(result,undefined,2);
	var link=document.createElement('a');
	link.download='data.java';
	var blob=new Blob([result], {type: 'text/java'});
	link.href=window.URL.createObjectURL(blob);
	link.click();}
console.log(result);
		return result;
	}
	
	return instance;
}